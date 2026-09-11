import { Test, TestingModule } from '@nestjs/testing';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';
import { ReviewStatus } from './enums/review-status.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('FindingsController', () => {
  let controller: FindingsController;
  let service: FindingsService;

  const mockReviewer: UserProfileDto = {
    id: '66da81234abcd5678ef01234',
    email: 'reviewer@synapsex.local',
    name: 'Senior Reviewer',
    role: Role.REVIEWER,
    isActive: true,
  };

  const mockFindingResponse = {
    id: '66da91234abcd5678ef09999',
    caseId: '66da81234abcd5678ef01111',
    title: 'Data Exfiltration via DNS',
    description: 'Suspicious DNS TXT payload queries',
    findingType: 'EXFILTRATION',
    confidenceScore: 0.9,
    evidenceStrength: 'HIGH',
    supportingEvidence: ['66da91234abcd5678ef05678'],
    supportingEntities: ['66da91234abcd5678ef07777'],
    reasoning: 'Sequential base64 chunks observed',
    limitations: 'Capture was truncated',
    generatedBy: 'AI_SERVICE',
    reviewStatus: ReviewStatus.PENDING_REVIEW,
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockFindingsService = {
    approveFinding: jest.fn().mockResolvedValue({
      ...mockFindingResponse,
      reviewStatus: ReviewStatus.APPROVED,
      reviewedBy: mockReviewer.id,
      reviewedAt: new Date().toISOString(),
      reviewComment: 'Approved conclusion',
    }),
    rejectFinding: jest.fn().mockResolvedValue({
      ...mockFindingResponse,
      reviewStatus: ReviewStatus.REJECTED,
      reviewedBy: mockReviewer.id,
      reviewedAt: new Date().toISOString(),
      reviewComment: 'Rejected false positive',
    }),
    findByCaseId: jest.fn().mockResolvedValue({
      items: [mockFindingResponse],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    findById: jest.fn().mockResolvedValue(mockFindingResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FindingsController],
      providers: [
        {
          provide: FindingsService,
          useValue: mockFindingsService,
        },
      ],
    }).compile();

    controller = module.get<FindingsController>(FindingsController);
    service = module.get<FindingsService>(FindingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('approve', () => {
    it('should invoke findingsService.approveFinding and return approved finding', async () => {
      const result = await controller.approve(
        '66da91234abcd5678ef09999',
        { comment: 'Approved conclusion' },
        mockReviewer,
        '127.0.0.1',
        'Jest-Agent',
      );

      expect(result.reviewStatus).toBe(ReviewStatus.APPROVED);
      expect(mockFindingsService.approveFinding).toHaveBeenCalledWith(
        '66da91234abcd5678ef09999',
        { comment: 'Approved conclusion' },
        mockReviewer,
        { ip: '127.0.0.1', userAgent: 'Jest-Agent' },
      );
    });
  });

  describe('reject', () => {
    it('should invoke findingsService.rejectFinding and return rejected finding', async () => {
      const result = await controller.reject(
        '66da91234abcd5678ef09999',
        { comment: 'Rejected false positive' },
        mockReviewer,
        '127.0.0.1',
        'Jest-Agent',
      );

      expect(result.reviewStatus).toBe(ReviewStatus.REJECTED);
      expect(mockFindingsService.rejectFinding).toHaveBeenCalledWith(
        '66da91234abcd5678ef09999',
        { comment: 'Rejected false positive' },
        mockReviewer,
        { ip: '127.0.0.1', userAgent: 'Jest-Agent' },
      );
    });
  });

  describe('findByCase', () => {
    it('should invoke findingsService.findByCaseId and return findings', async () => {
      const result = await controller.findByCase(
        '66da81234abcd5678ef01111',
        { reviewStatus: ReviewStatus.PENDING_REVIEW },
        mockReviewer,
      );

      expect(result.items.length).toBe(1);
      expect(result.items[0].findingType).toBe('EXFILTRATION');
      expect(mockFindingsService.findByCaseId).toHaveBeenCalledWith(
        '66da81234abcd5678ef01111',
        { reviewStatus: ReviewStatus.PENDING_REVIEW },
        mockReviewer,
      );
    });
  });

  describe('findById', () => {
    it('should invoke findingsService.findById and return finding detail', async () => {
      const result = await controller.findById(
        '66da91234abcd5678ef09999',
        mockReviewer,
      );

      expect(result.id).toBe('66da91234abcd5678ef09999');
      expect(mockFindingsService.findById).toHaveBeenCalledWith(
        '66da91234abcd5678ef09999',
        mockReviewer,
      );
    });
  });
});
