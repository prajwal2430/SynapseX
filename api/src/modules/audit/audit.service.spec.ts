import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AuditService } from './audit.service';
import { AuditLog } from './schemas/audit-log.schema';
import { AuditAction } from './enums/audit-action.enum';

describe('AuditService', () => {
  let service: AuditService;

  const mockUserId = new Types.ObjectId().toString();
  const mockAuditRecord = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(mockUserId),
    action: AuditAction.CASE_CREATED,
    resourceType: 'Case',
    resourceId: new Types.ObjectId().toString(),
    timestamp: new Date('2026-09-06T02:00:00.000Z'),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 TestAgent',
    metadata: { caseNumber: 'CASE-2026-0001' },
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockAuditLogModel {
    _id = mockAuditRecord._id;
    userId = mockAuditRecord.userId;
    action = mockAuditRecord.action;
    resourceType = mockAuditRecord.resourceType;
    resourceId = mockAuditRecord.resourceId;
    timestamp = mockAuditRecord.timestamp;
    ipAddress = mockAuditRecord.ipAddress;
    userAgent = mockAuditRecord.userAgent;
    metadata = mockAuditRecord.metadata;

    constructor(public data: any) {
      Object.assign(this, data);
    }

    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
    static countDocuments = jest.fn();
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: MockAuditLogModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log (Backend-generated event)', () => {
    it('should save audit log with user and context', async () => {
      const result = await service.log({
        userId: mockUserId,
        action: AuditAction.CASE_CREATED,
        resourceType: 'Case',
        resourceId: '66da81234abcd5678ef05678',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 TestAgent',
        metadata: { caseNumber: 'CASE-2026-0001' },
      });

      expect(result).toBeDefined();
      expect(result.action).toBe(AuditAction.CASE_CREATED);
      expect(result.resourceType).toBe('Case');
      expect(result.ipAddress).toBe('192.168.1.100');
    });

    it('should handle unauthenticated / anonymous events (null userId)', async () => {
      const result = await service.log({
        userId: null,
        action: AuditAction.USER_LOGIN_FAILED,
        resourceType: 'Auth',
        ipAddress: '10.0.0.1',
        metadata: { attemptedEmail: 'unknown@attacker.xyz' },
      });

      expect(result).toBeDefined();
      expect(result.userId).toBeNull();
      expect(result.action).toBe(AuditAction.USER_LOGIN_FAILED);
    });
  });

  describe('findLogs', () => {
    it('should return paginated audit logs with metadata', async () => {
      MockAuditLogModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(45),
      });

      MockAuditLogModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockAuditRecord]),
      });

      const result = await service.findLogs({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(45);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should filter by action, user, and date range', async () => {
      MockAuditLogModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      MockAuditLogModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockAuditRecord]),
      });

      const result = await service.findLogs({
        userId: mockUserId,
        action: AuditAction.CASE_CREATED,
        resourceType: 'Case',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
      });

      expect(result.data).toHaveLength(1);
      expect(MockAuditLogModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CASE_CREATED,
          resourceType: 'Case',
          timestamp: expect.objectContaining({
            $gte: new Date('2026-09-01T00:00:00.000Z'),
            $lte: new Date('2026-09-30T23:59:59.999Z'),
          }),
        }),
      );
    });
  });
});
