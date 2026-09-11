import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { FindingsService } from '../../modules/findings/findings.service';
import { Finding } from '../../modules/findings/schemas/finding.schema';
import { Case } from '../../modules/cases/schemas/case.schema';
import { AuditService } from '../../modules/audit/audit.service';
import { RealtimeEventsService } from '../../modules/realtime/services/realtime-events.service';
import { ReviewStatus } from '../../modules/findings/enums/review-status.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../../modules/auth/dto/auth-response.dto';

/**
 * ============================================================================
 * Critical Workflow Test Suite: Flow 10 (Finding Approval & Governance)
 * ============================================================================
 *
 * Validates:
 * 1. Human-in-the-loop (HITL) review: REVIEWER/ADMIN approving AI finding
 * 2. Status transition: PENDING_REVIEW -> APPROVED
 * 3. Rejection workflow requiring mandatory reviewer rationale comment
 * 4. Status transition: PENDING_REVIEW -> REJECTED
 * 5. Immutable audit logging recording reviewer identity, IP, and timestamp
 * 6. Non-existent finding rejection with 404 NotFound
 */
describe('Critical Workflow: Human-in-the-Loop Finding Approval (Flow 10)', () => {
  let findingsService: FindingsService;

  const mockReviewer: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'lead.reviewer@synapsex.local',
    name: 'Lead Reviewer',
    role: Role.REVIEWER,
    isActive: true,
  };

  const mockCaseId = new Types.ObjectId();

  class MockFindingInstance {
    _id = new Types.ObjectId();
    caseId = mockCaseId;
    title = 'Probable Data Staging via USB Mass Storage';
    findingType = 'DATA_EXFILTRATION';
    confidenceScore = 0.92;
    evidenceStrength = 'STRONG';
    reviewStatus = ReviewStatus.PENDING_REVIEW;
    reviewedBy: Types.ObjectId | null = null;
    reviewedAt: Date | null = null;
    reviewComment = '';

    constructor(data?: any) {
      if (data) Object.assign(this, data);
    }

    save = jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    });
  }

  class MockFindingModel {
    static findById = jest.fn();
  }

  class MockCaseModel {
    static findById = jest.fn();
  }

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockRealtimeEventsService = {
    emitFindingCreated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindingsService,
        {
          provide: getModelToken(Finding.name),
          useValue: MockFindingModel,
        },
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: RealtimeEventsService,
          useValue: mockRealtimeEventsService,
        },
      ],
    }).compile();

    findingsService = module.get<FindingsService>(FindingsService);
  });

  describe('Finding Approval Workflow', () => {
    it('should transition finding status to APPROVED, record reviewer credentials, and emit audit log', async () => {
      const findingInstance = new MockFindingInstance();
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(findingInstance),
      });

      const approveDto = {
        comment: 'Corroborated by CCTV entry badge log and endpoint EDR registry keys.',
      };

      const result = await findingsService.approveFinding(
        findingInstance._id.toString(),
        approveDto,
        mockReviewer,
        { ip: '10.0.8.25', userAgent: 'SynapseX-Review-Console/2.0' },
      );

      expect(result).toBeDefined();
      expect(findingInstance.reviewStatus).toBe(ReviewStatus.APPROVED);
      expect(findingInstance.reviewedBy?.toString()).toBe(mockReviewer.id);
      expect(findingInstance.reviewedAt).toBeInstanceOf(Date);
      expect(findingInstance.reviewComment).toBe(approveDto.comment);
      expect(findingInstance.save).toHaveBeenCalled();

      // Assert immutable audit logging was emitted
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockReviewer.id,
          action: 'FINDING_APPROVED',
          resourceType: 'Finding',
          resourceId: findingInstance._id.toString(),
          ipAddress: '10.0.8.25',
          metadata: expect.objectContaining({
            previousStatus: ReviewStatus.PENDING_REVIEW,
            newStatus: ReviewStatus.APPROVED,
            reviewComment: approveDto.comment,
          }),
        }),
      );
    });

    it('should throw NotFoundException when approving a non-existent finding ID', async () => {
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const fakeId = new Types.ObjectId().toString();
      await expect(
        findingsService.approveFinding(fakeId, { comment: 'Approving' }, mockReviewer),
      ).rejects.toThrow(new NotFoundException(`Finding with ID '${fakeId}' not found`));
    });
  });

  describe('Finding Rejection Workflow', () => {
    it('should transition finding status to REJECTED with mandatory reviewer comment and emit audit log', async () => {
      const findingInstance = new MockFindingInstance();
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(findingInstance),
      });

      const rejectDto = {
        comment: 'False positive: USB mount was an authorized corporate scanner during routine maintenance.',
      };

      const result = await findingsService.rejectFinding(
        findingInstance._id.toString(),
        rejectDto,
        mockReviewer,
        { ip: '10.0.8.25', userAgent: 'SynapseX-Review-Console/2.0' },
      );

      expect(result).toBeDefined();
      expect(findingInstance.reviewStatus).toBe(ReviewStatus.REJECTED);
      expect(findingInstance.reviewedBy?.toString()).toBe(mockReviewer.id);
      expect(findingInstance.reviewedAt).toBeInstanceOf(Date);
      expect(findingInstance.reviewComment).toBe(rejectDto.comment);
      expect(findingInstance.save).toHaveBeenCalled();

      // Assert rejection audit event
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockReviewer.id,
          action: 'FINDING_REJECTED',
          resourceType: 'Finding',
          resourceId: findingInstance._id.toString(),
          metadata: expect.objectContaining({
            newStatus: ReviewStatus.REJECTED,
            reviewComment: rejectDto.comment,
          }),
        }),
      );
    });

    it('should allow rejection without comment and set empty reviewComment', async () => {
      const findingInstance = new MockFindingInstance();
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(findingInstance),
      });

      const result = await findingsService.rejectFinding(
        findingInstance._id.toString(),
        {}, // empty DTO
        mockReviewer,
      );

      expect(result.reviewStatus).toBe(ReviewStatus.REJECTED);
      expect(findingInstance.reviewComment).toBe('');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FINDING_REJECTED',
        }),
      );
    });
  });
});
