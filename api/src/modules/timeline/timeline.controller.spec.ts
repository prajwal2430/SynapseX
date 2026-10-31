import { Test, TestingModule } from '@nestjs/testing';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('TimelineController', () => {
  let controller: TimelineController;
  let service: TimelineService;

  const mockUser: UserProfileDto = {
    id: '66da81234abcd5678ef01234',
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockTimelineEventResponse = {
    id: '66da91234abcd5678ef08888',
    caseId: '66da81234abcd5678ef01111',
    evidenceId: '66da91234abcd5678ef05678',
    timestamp: '2026-09-06 01:15:30.450',
    timezone: 'UTC',
    normalizedTimestamp: '2026-09-06T01:15:30.450Z',
    eventType: 'user_logon',
    title: 'User Logon via RDP',
    description: 'Investigator Alex logged into workstation',
    source: 'auth.log',
    entities: [{ entityType: 'USER', entityValue: 'alex' }],
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTimelineService = {
    findByCaseId: jest.fn().mockResolvedValue({
      items: [mockTimelineEventResponse],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    }),
    findById: jest.fn().mockResolvedValue(mockTimelineEventResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimelineController],
      providers: [
        {
          provide: TimelineService,
          useValue: mockTimelineService,
        },
      ],
    }).compile();

    controller = module.get<TimelineController>(TimelineController);
    service = module.get<TimelineService>(TimelineService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByCase', () => {
    it('should invoke timelineService.findByCaseId and return paginated timeline events', async () => {
      const result = await controller.findByCase(
        '66da81234abcd5678ef01111',
        {
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-09-07T00:00:00.000Z',
          sortBy: 'normalizedTimestamp',
          sortOrder: 'asc',
        },
        mockUser,
      );

      expect(result.items.length).toBe(1);
      expect(result.items[0].eventType).toBe('user_logon');
      expect(mockTimelineService.findByCaseId).toHaveBeenCalledWith(
        '66da81234abcd5678ef01111',
        {
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-09-07T00:00:00.000Z',
          sortBy: 'normalizedTimestamp',
          sortOrder: 'asc',
        },
        mockUser,
      );
    });
  });

  describe('findById', () => {
    it('should invoke timelineService.findById and return event detail', async () => {
      const result = await controller.findById(
        '66da91234abcd5678ef08888',
        mockUser,
      );

      expect(result.id).toBe('66da91234abcd5678ef08888');
      expect(mockTimelineService.findById).toHaveBeenCalledWith(
        '66da91234abcd5678ef08888',
        mockUser,
      );
    });
  });
});
