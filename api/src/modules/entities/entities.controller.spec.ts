import { Test, TestingModule } from '@nestjs/testing';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { EntityType } from './enums/entity-type.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('EntitiesController', () => {
  let controller: EntitiesController;
  let service: EntitiesService;

  const mockUser: UserProfileDto = {
    id: '66da81234abcd5678ef01234',
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockEntityResponse = {
    id: '66da91234abcd5678ef07777',
    caseId: '66da81234abcd5678ef01111',
    evidenceId: '66da91234abcd5678ef05678',
    type: EntityType.IP_ADDRESS,
    value: '192.168.1.100',
    normalizedValue: '192.168.1.100',
    confidence: 0.99,
    source: 'firewall.log',
    extractionMethod: 'AI_ANALYSIS',
    evidenceStrength: 'HIGH',
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockEntitiesService = {
    findByCaseId: jest.fn().mockResolvedValue({
      items: [mockEntityResponse],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    findById: jest.fn().mockResolvedValue(mockEntityResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntitiesController],
      providers: [
        {
          provide: EntitiesService,
          useValue: mockEntitiesService,
        },
      ],
    }).compile();

    controller = module.get<EntitiesController>(EntitiesController);
    service = module.get<EntitiesService>(EntitiesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByCase', () => {
    it('should invoke entitiesService.findByCaseId and return paginated entities', async () => {
      const result = await controller.findByCase(
        '66da81234abcd5678ef01111',
        { type: EntityType.IP_ADDRESS, search: '192.168' },
        mockUser,
      );

      expect(result.items.length).toBe(1);
      expect(result.items[0].value).toBe('192.168.1.100');
      expect(mockEntitiesService.findByCaseId).toHaveBeenCalledWith(
        '66da81234abcd5678ef01111',
        { type: EntityType.IP_ADDRESS, search: '192.168' },
        mockUser,
      );
    });
  });

  describe('findById', () => {
    it('should invoke entitiesService.findById and return entity detail', async () => {
      const result = await controller.findById(
        '66da91234abcd5678ef07777',
        mockUser,
      );

      expect(result.id).toBe('66da91234abcd5678ef07777');
      expect(mockEntitiesService.findById).toHaveBeenCalledWith(
        '66da91234abcd5678ef07777',
        mockUser,
      );
    });
  });
});
