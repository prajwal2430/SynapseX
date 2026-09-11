import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EntitiesService } from './entities.service';
import { Entity } from './schemas/entity.schema';
import { Case } from '../cases/schemas/case.schema';
import { EntityType } from './enums/entity-type.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('EntitiesService', () => {
  let service: EntitiesService;

  const mockCaseId = new Types.ObjectId().toString();
  const mockEvidenceId = new Types.ObjectId().toString();
  const mockEntityId = new Types.ObjectId().toString();

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

  const mockEntityDoc = {
    _id: new Types.ObjectId(mockEntityId),
    caseId: new Types.ObjectId(mockCaseId),
    evidenceId: new Types.ObjectId(mockEvidenceId),
    type: EntityType.IP_ADDRESS,
    value: '192.168.1.105:8080',
    normalizedValue: '192.168.1.105',
    confidence: 0.9,
    source: 'network_triage.log',
    extractionMethod: 'AI_ANALYSIS',
    evidenceStrength: 'HIGH',
    metadata: { occurrences: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockEntityModel {
    _id = mockEntityDoc._id;
    caseId = mockEntityDoc.caseId;
    evidenceId = mockEntityDoc.evidenceId;
    type = mockEntityDoc.type;
    value = mockEntityDoc.value;
    normalizedValue = mockEntityDoc.normalizedValue;
    confidence = mockEntityDoc.confidence;
    source = mockEntityDoc.source;
    extractionMethod = mockEntityDoc.extractionMethod;
    evidenceStrength = mockEntityDoc.evidenceStrength;
    metadata = mockEntityDoc.metadata;
    createdAt = mockEntityDoc.createdAt;
    updatedAt = mockEntityDoc.updatedAt;

    constructor(public data: any) {
      Object.assign(this, data);
      this._id = new Types.ObjectId();
    }
    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
    static findOne = jest.fn();
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
        EntitiesService,
        {
          provide: getModelToken(Entity.name),
          useValue: MockEntityModel,
        },
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertEntity & Deduplication', () => {
    it('should create new entity when not existing', async () => {
      MockEntityModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.upsertEntity({
        caseId: mockCaseId,
        evidenceId: mockEvidenceId,
        type: EntityType.EMAIL,
        value: '  Test.User@SynapseX.Local  ',
        confidence: 0.95,
        source: 'email.eml',
      });

      expect(result).toBeDefined();
      expect(result.normalizedValue).toBe('test.user@synapsex.local');
    });

    it('should deduplicate and update occurrences when entity already exists', async () => {
      const existingDoc = {
        ...mockEntityDoc,
        confidence: 0.8,
        metadata: { occurrences: 1 },
        save: jest.fn().mockResolvedValue({
          ...mockEntityDoc,
          confidence: 0.95,
          metadata: { occurrences: 2 },
        }),
      };

      MockEntityModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingDoc),
      });

      const result = await service.upsertEntity({
        caseId: mockCaseId,
        evidenceId: mockEvidenceId,
        type: EntityType.IP_ADDRESS,
        value: '192.168.1.105:8080',
        confidence: 0.95,
        source: 'network_triage.log',
      });

      expect(existingDoc.save).toHaveBeenCalled();
      expect(existingDoc.confidence).toBe(0.95);
      expect(existingDoc.metadata.occurrences).toBe(2);
    });
  });

  describe('ingestExtractedEntities', () => {
    it('should ingest and normalize valid extracted entities', async () => {
      MockEntityModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const rawEntities = [
        {
          entityType: 'ip_address',
          entityValue: '10.0.0.1',
          confidence: 1.0,
        },
        {
          entityType: 'email',
          entityValue: 'admin@synapsex.local',
          confidence: 0.9,
        },
      ];

      const results = await service.ingestExtractedEntities(
        mockCaseId,
        mockEvidenceId,
        'triage.log',
        rawEntities,
      );

      expect(results.length).toBe(2);
    });
  });

  describe('findByCaseId', () => {
    it('should return paginated entities for authorized investigator', async () => {
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      MockEntityModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockEntityDoc]),
            }),
          }),
        }),
      });

      MockEntityModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findByCaseId(
        mockCaseId,
        { search: '192.168', type: EntityType.IP_ADDRESS },
        mockUser,
      );

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].normalizedValue).toBe('192.168.1.105');
    });

    it('should throw ForbiddenException if user has no access to case', async () => {
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
  });

  describe('findById', () => {
    it('should return entity by ID when authorized', async () => {
      MockEntityModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEntityDoc),
      });
      MockCaseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      const result = await service.findById(mockEntityId, mockUser);
      expect(result.id).toBe(mockEntityId);
      expect(result.normalizedValue).toBe('192.168.1.105');
    });

    it('should throw NotFoundException if entity not found', async () => {
      MockEntityModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findById(mockEntityId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
