import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CasesService } from './cases.service';
import { Case } from './schemas/case.schema';
import { CaseStatus } from './enums/case-status.enum';
import { CasePriority } from './enums/case-priority.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('CasesService', () => {
  let service: CasesService;

  const adminUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'admin@synapsex.local',
    name: 'Admin User',
    role: Role.ADMIN,
    isActive: true,
  };

  const investigatorUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'investigator@synapsex.local',
    name: 'Investigator One',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const unassignedInvestigator: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'stranger@synapsex.local',
    name: 'Unassigned Investigator',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockCaseDoc = {
    _id: new Types.ObjectId(),
    caseNumber: 'CASE-2026-0001',
    title: 'Insider Threat Exfiltration',
    description: 'Data exfiltration incident via USB',
    status: CaseStatus.OPEN,
    priority: CasePriority.HIGH,
    createdBy: new Types.ObjectId(investigatorUser.id),
    assignedUsers: [new Types.ObjectId(investigatorUser.id)],
    tags: ['insider-threat'],
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockCaseModel {
    _id = mockCaseDoc._id;
    caseNumber = mockCaseDoc.caseNumber;
    title = mockCaseDoc.title;
    description = mockCaseDoc.description;
    status = mockCaseDoc.status;
    priority = mockCaseDoc.priority;
    createdBy = mockCaseDoc.createdBy;
    assignedUsers = mockCaseDoc.assignedUsers;
    tags = mockCaseDoc.tags;
    isDeleted = mockCaseDoc.isDeleted;
    deletedAt = mockCaseDoc.deletedAt;

    constructor(public data: any) {
      Object.assign(this, data);
      this._id = mockCaseDoc._id;
    }
    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
    static findOne = jest.fn();
    static countDocuments = jest.fn();
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a case with auto-generated case number and assign creator', async () => {
      MockCaseModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null), // First case of the year
      });

      const createDto = {
        title: 'New Incident Case',
        description: 'Forensic acquisition and triage',
        priority: CasePriority.HIGH,
        tags: ['triage'],
      };

      const result = await service.create(createDto, investigatorUser);

      expect(result).toBeDefined();
      expect(result.caseNumber).toMatch(/^CASE-\d{4}-0001$/);
      expect(result.title).toBe(createDto.title);
    });

    it('should increment existing case sequence when cases exist for current year', async () => {
      const year = new Date().getFullYear();
      MockCaseModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ caseNumber: `CASE-${year}-0005` }),
      });

      const createDto = {
        title: 'Consecutive Case',
        description: 'Testing increment',
      };

      const result = await service.create(createDto, investigatorUser);

      expect(result.caseNumber).toBe(`CASE-${year}-0006`);
    });
  });

  describe('findAll', () => {
    it('should return paginated and filtered cases', async () => {
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockCaseDoc]),
      };

      MockCaseModel.find.mockReturnValue(mockQueryChain);
      MockCaseModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'Threat',
        status: CaseStatus.OPEN,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].caseNumber).toBe(mockCaseDoc.caseNumber);
    });
  });

  describe('findById', () => {
    it('should return case by ID if active and exists', async () => {
      MockCaseModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      const result = await service.findById(mockCaseDoc._id.toString());

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCaseDoc._id.toString());
    });

    it('should throw NotFoundException if case is not found or soft-deleted', async () => {
      MockCaseModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should allow ADMIN to update any case', async () => {
      const caseToUpdate = {
        ...mockCaseDoc,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(caseToUpdate),
      });

      const result = await service.update(
        mockCaseDoc._id.toString(),
        { title: 'Admin Override Title' },
        adminUser,
      );

      expect(result.title).toBe('Admin Override Title');
    });

    it('should allow assigned INVESTIGATOR to update case', async () => {
      const caseToUpdate = {
        ...mockCaseDoc,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(caseToUpdate),
      });

      const result = await service.update(
        mockCaseDoc._id.toString(),
        { status: CaseStatus.IN_PROGRESS },
        investigatorUser,
      );

      expect(result.status).toBe(CaseStatus.IN_PROGRESS);
    });

    it('should throw ForbiddenException if INVESTIGATOR is not assigned to the case', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      await expect(
        service.update(
          mockCaseDoc._id.toString(),
          { title: 'Unauthorized Edit' },
          unassignedInvestigator,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should allow ADMIN to soft-delete any case', async () => {
      const caseToDelete = {
        ...mockCaseDoc,
        isDeleted: false,
        deletedAt: null,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(caseToDelete),
      });

      const result = await service.delete(mockCaseDoc._id.toString(), adminUser);

      expect(result.deleted).toBe(true);
      expect(caseToDelete.isDeleted).toBe(true);
      expect(caseToDelete.deletedAt).toBeDefined();
    });

    it('should allow assigned INVESTIGATOR to soft-delete assigned case', async () => {
      const caseToDelete = {
        ...mockCaseDoc,
        isDeleted: false,
        deletedAt: null,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(caseToDelete),
      });

      const result = await service.delete(
        mockCaseDoc._id.toString(),
        investigatorUser,
      );

      expect(result.deleted).toBe(true);
      expect(caseToDelete.isDeleted).toBe(true);
    });

    it('should throw ForbiddenException if unassigned INVESTIGATOR attempts to delete case', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      });

      await expect(
        service.delete(mockCaseDoc._id.toString(), unassignedInvestigator),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
