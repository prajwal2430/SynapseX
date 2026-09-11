import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TimelineService } from './timeline.service';
import { TimelineEvent } from './schemas/timeline-event.schema';
import { Case } from '../cases/schemas/case.schema';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('TimelineService', () => {
  let service: TimelineService;

  const mockCaseId = new Types.ObjectId().toString();
  const mockEvidenceId = new Types.ObjectId().toString();
  const mockEventId = new Types.ObjectId().toString();

  const mockUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockCaseDoc = {
    _id: new Types.ObjectId(mockCaseId),
    caseNumber: 'CASE-2026-0001',
    createdBy: new Types.ObjectId(mockUser.id),
    assignedUsers: [new Types.ObjectId(mockUser.id)],
    isDeleted: false,
  };

  const mockTimelineEventDoc = {
    _id: new Types.ObjectId(mockEventId),
    caseId: new Types.ObjectId(mockCaseId),
    evidenceId: new Types.ObjectId(mockEvidenceId),
    timestamp: '2026-09-06 06:45:00+05:30',
    timezone: '+05:30',
    normalizedTimestamp: new Date('2026-09-06T01:15:00.000Z'),
    eventType: 'user_logon',
    title: 'Workstation Logon',
    description: 'User alex logged in',
    source: 'auth.log',
    entities: [{ entityType: 'USER', entityValue: 'alex' }],
    metadata: { workstation: 'WKSTN-892' },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockTimelineEventModel {
    _id = mockTimelineEventDoc._id;
    caseId = mockTimelineEventDoc.caseId;
    evidenceId = mockTimelineEventDoc.evidenceId;
    timestamp = mockTimelineEventDoc.timestamp;
    timezone = mockTimelineEventDoc.timezone;
    normalizedTimestamp = mockTimelineEventDoc.normalizedTimestamp;
    eventType = mockTimelineEventDoc.eventType;
    title = mockTimelineEventDoc.title;
    description = mockTimelineEventDoc.description;
    source = mockTimelineEventDoc.source;
    entities = mockTimelineEventDoc.entities;
    metadata = mockTimelineEventDoc.metadata;
    createdAt = mockTimelineEventDoc.createdAt;
    updatedAt = mockTimelineEventDoc.updatedAt;

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        {
          provide: getModelToken(TimelineEvent.name),
          useValue: MockTimelineEventModel,
        },
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTimelineEvent', () => {
    it('should create event preserving source timestamp, timezone, and computing normalized UTC Date', async () => {
      const result = await service.createTimelineEvent({
        caseId: mockCaseId,
        evidenceId: mockEvidenceId,
        timestamp: '2026-09-06 06:45:00+05:30',
        timezone: '+05:30',
        eventType: 'network_connection',
        title: 'Outbound C2 beacon',
        source: 'firewall.log',
      });

      expect(result).toBeDefined();
      expect(result.timestamp).toBe('2026-09-06 06:45:00+05:30');
      expect(result.timezone).toBe('+05:30');
      expect(result.normalizedTimestamp.toISOString()).toBe('2026-09-06T01:15:00.000Z');
    });
  });

  describe('findByCaseId', () => {
    it('should return paginated events with date-range filtering for authorized investigator', async () => {
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      MockTimelineEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockTimelineEventDoc]),
            }),
          }),
        }),
      });

      MockTimelineEventModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findByCaseId(
        mockCaseId,
        {
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-09-07T00:00:00.000Z',
          sortBy: 'normalizedTimestamp',
          sortOrder: 'asc',
        },
        mockUser,
      );

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].timestamp).toBe('2026-09-06 06:45:00+05:30');
      expect(result.items[0].normalizedTimestamp).toBe('2026-09-06T01:15:00.000Z');
    });

    it('should throw ForbiddenException if user lacks case permissions', async () => {
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockCaseDoc,
          createdBy: new Types.ObjectId(),
          assignedUsers: [],
        }),
      });

      await expect(
        service.findByCaseId(mockCaseId, {}, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if case does not exist', async () => {
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findByCaseId(mockCaseId, {}, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return timeline event by ID for authorized investigator', async () => {
      MockTimelineEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTimelineEventDoc),
      });
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      const result = await service.findById(mockEventId, mockUser);
      expect(result.id).toBe(mockEventId);
      expect(result.title).toBe('Workstation Logon');
    });

    it('should throw NotFoundException if event does not exist', async () => {
      MockTimelineEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(mockEventId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
