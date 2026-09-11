import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditAction } from './enums/audit-action.enum';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: AuditService;

  const mockPaginatedResponse = {
    data: [
      {
        id: '66da81234abcd5678ef09999',
        userId: '66da81234abcd5678ef01234',
        action: AuditAction.CASE_CREATED,
        resourceType: 'Case',
        resourceId: '66da81234abcd5678ef05678',
        timestamp: '2026-09-06T02:00:00.000Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 TestAgent',
        metadata: { caseNumber: 'CASE-2026-0001' },
      },
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  const mockAuditService = {
    findLogs: jest.fn().mockResolvedValue(mockPaginatedResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(auditService).toBeDefined();
  });

  describe('getAuditLogs', () => {
    it('should invoke auditService.findLogs with query filters and return paginated logs', async () => {
      const query = {
        page: 1,
        limit: 20,
        action: AuditAction.CASE_CREATED,
        startDate: '2026-09-01T00:00:00.000Z',
      };

      const result = await controller.getAuditLogs(query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockAuditService.findLogs).toHaveBeenCalledWith(query);
    });
  });
});
