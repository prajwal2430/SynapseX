import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FindingsService } from './findings.service';
import { Finding } from './schemas/finding.schema';
import { Case } from '../cases/schemas/case.schema';
import { AuditService } from '../audit/audit.service';
import { ReviewStatus } from './enums/review-status.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('FindingsService', () => {
  let service: FindingsService;
  let auditService: AuditService;

  const mockCaseId = new Types.ObjectId().toString();
  const mockFindingId = new Types.ObjectId().toString();

  const mockReviewer: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'reviewer@synapsex.local',
    name: 'Senior Reviewer',
    role: Role.REVIEWER,
    isActive: true,
  };

  const mockCaseDoc = {
    _id: new Types.ObjectId(mockCaseId),
    caseNumber: 'CASE-2026-0001',
    createdBy: new Types.ObjectId(mockReviewer.id),
    assignedUsers: [new Types.ObjectId(mockReviewer.id)],
    isDeleted: false,
  };

  const mockFindingDoc = {
    _id: new Types.ObjectId(mockFindingId),
    caseId: new Types.ObjectId(mockCaseId),
    title: 'Data Exfiltration to C2',
    description: '45 DNS queries containing encrypted chunks',
    findingType: 'EXFILTRATION',
    confidenceScore: 0.92,
    evidenceStrength: 'HIGH',
    supportingEvidence: [new Types.ObjectId()],
    supportingEntities: [new Types.ObjectId()],
    reasoning: 'Sequential base64 chunks observed in query stream',
    limitations: 'Packet capture was truncated',
    generatedBy: 'AI_SERVICE',
    reviewStatus: ReviewStatus.PENDING_REVIEW,
    reviewedBy: null as Types.ObjectId | null,
    reviewedAt: null as Date | null,
    reviewComment: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockFindingModel {
    _id = mockFindingDoc._id;
    caseId = mockFindingDoc.caseId;
    title = mockFindingDoc.title;
    description = mockFindingDoc.description;
    findingType = mockFindingDoc.findingType;
    confidenceScore = mockFindingDoc.confidenceScore;
    evidenceStrength = mockFindingDoc.evidenceStrength;
    supportingEvidence = mockFindingDoc.supportingEvidence;
    supportingEntities = mockFindingDoc.supportingEntities;
    reasoning = mockFindingDoc.reasoning;
    limitations = mockFindingDoc.limitations;
    generatedBy = mockFindingDoc.generatedBy;
    reviewStatus = mockFindingDoc.reviewStatus;
    reviewedBy = mockFindingDoc.reviewedBy;
    reviewedAt = mockFindingDoc.reviewedAt;
    reviewComment = mockFindingDoc.reviewComment;
    createdAt = mockFindingDoc.createdAt;
    updatedAt = mockFindingDoc.updatedAt;

    constructor(public data: any) {
      Object.assign(this, data);
      this._id = new Types.ObjectId();
    }
    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
    static findById = jest.fn();
    static countDocuments = jest.fn();
  }

  class MockCaseModel {
    static findById = jest.fn();
  }

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
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
      ],
    }).compile();

    service = module.get<FindingsService>(FindingsService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFinding', () => {
    it('should strictly default reviewStatus to PENDING_REVIEW', async () => {
      const result = await service.createFinding({
        caseId: mockCaseId,
        title: 'Unauthorized Privilege Escalation',
        description: 'Observed access to LSASS memory',
        findingType: 'PRIVILEGE_ESCALATION',
        confidenceScore: 0.85,
        reasoning: 'Process handle opened with PROCESS_ALL_ACCESS',
      });

      expect(result).toBeDefined();
      expect(result.reviewStatus).toBe(ReviewStatus.PENDING_REVIEW);
      expect(result.reviewedBy).toBeNull();
      expect(result.reviewedAt).toBeNull();
    });
  });

  describe('approveFinding', () => {
    it('should update status to APPROVED, set reviewer details, and log audit record', async () => {
      mockFindingDoc.reviewStatus = ReviewStatus.PENDING_REVIEW;
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFindingDoc),
      });

      const result = await service.approveFinding(
        mockFindingId,
        { comment: 'Verified and confirmed through secondary log correlation.' },
        mockReviewer,
        { ip: '192.168.1.5', userAgent: 'Chrome/120' },
      );

      expect(mockFindingDoc.reviewStatus).toBe(ReviewStatus.APPROVED);
      expect(mockFindingDoc.reviewComment).toContain('Verified and confirmed');
      expect(mockFindingDoc.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockReviewer.id,
          action: 'FINDING_APPROVED',
          resourceType: 'Finding',
          resourceId: mockFindingId,
        }),
      );
      expect(result.reviewStatus).toBe(ReviewStatus.APPROVED);
    });

    it('should throw NotFoundException if finding not found', async () => {
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.approveFinding(mockFindingId, {}, mockReviewer),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectFinding', () => {
    it('should update status to REJECTED, set reviewer details, and log audit record', async () => {
      mockFindingDoc.reviewStatus = ReviewStatus.PENDING_REVIEW;
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFindingDoc),
      });

      const result = await service.rejectFinding(
        mockFindingId,
        { comment: 'False positive; verified scheduled administrative maintenance.' },
        mockReviewer,
      );

      expect(mockFindingDoc.reviewStatus).toBe(ReviewStatus.REJECTED);
      expect(mockFindingDoc.reviewComment).toContain('False positive');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FINDING_REJECTED',
          resourceId: mockFindingId,
        }),
      );
      expect(result.reviewStatus).toBe(ReviewStatus.REJECTED);
    });
  });

  describe('findByCaseId', () => {
    it('should return paginated findings with reviewStatus filter', async () => {
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      MockFindingModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockFindingDoc]),
            }),
          }),
        }),
      });

      MockFindingModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findByCaseId(
        mockCaseId,
        { reviewStatus: ReviewStatus.PENDING_REVIEW },
        mockReviewer,
      );

      expect(result.total).toBe(1);
      expect(result.items[0].findingType).toBe('EXFILTRATION');
    });

    it('should throw ForbiddenException if user not assigned to case', async () => {
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockCaseDoc,
          createdBy: new Types.ObjectId(),
          assignedUsers: [],
        }),
      });

      const unauthorizedUser: UserProfileDto = {
        id: new Types.ObjectId().toString(),
        email: 'other@synapsex.local',
        name: 'Other Investigator',
        role: Role.INVESTIGATOR,
        isActive: true,
      };

      await expect(
        service.findByCaseId(mockCaseId, {}, unauthorizedUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findById', () => {
    it('should return finding by ID for authorized investigator', async () => {
      MockFindingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFindingDoc),
      });
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      const result = await service.findById(mockFindingId, mockReviewer);
      expect(result.id).toBe(mockFindingId);
      expect(result.title).toBe('Data Exfiltration to C2');
    });
  });
});
