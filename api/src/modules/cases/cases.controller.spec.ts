import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { Role } from '../../common/enums/role.enum';
import { CaseStatus } from './enums/case-status.enum';
import { CasePriority } from './enums/case-priority.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

describe('CasesController', () => {
  let controller: CasesController;
  let service: CasesService;
  let reflector: Reflector;

  const mockUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockCaseResponse = {
    id: '66da81234abcd5678ef05678',
    caseNumber: 'CASE-2026-0001',
    title: 'Insider Threat Exfiltration',
    description: 'Data exfiltration incident via USB',
    status: CaseStatus.OPEN,
    priority: CasePriority.HIGH,
    createdBy: mockUser.id,
    assignedUsers: [mockUser.id],
    tags: ['insider-threat'],
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCasesService = {
    create: jest.fn().mockResolvedValue(mockCaseResponse),
    findAll: jest.fn().mockResolvedValue({
      items: [mockCaseResponse],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    findById: jest.fn().mockResolvedValue(mockCaseResponse),
    update: jest.fn().mockResolvedValue({
      ...mockCaseResponse,
      title: 'Updated Case Title',
    }),
    delete: jest.fn().mockResolvedValue({
      deleted: true,
      message: 'Case CASE-2026-0001 successfully deleted',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasesController],
      providers: [
        Reflector,
        {
          provide: CasesService,
          useValue: mockCasesService,
        },
      ],
    }).compile();

    controller = module.get<CasesController>(CasesController);
    service = module.get<CasesService>(CasesService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('RBAC Metadata Verification', () => {
    it('should restrict create, update, and delete to ADMIN and INVESTIGATOR (excluding VIEWER)', () => {
      const createRoles = reflector.get<Role[]>(ROLES_KEY, controller.create);
      const updateRoles = reflector.get<Role[]>(ROLES_KEY, controller.update);
      const deleteRoles = reflector.get<Role[]>(ROLES_KEY, controller.delete);

      expect(createRoles).toEqual([Role.ADMIN, Role.INVESTIGATOR]);
      expect(updateRoles).toEqual([Role.ADMIN, Role.INVESTIGATOR]);
      expect(deleteRoles).toEqual([Role.ADMIN, Role.INVESTIGATOR]);

      // Confirm VIEWER cannot create, update, or delete
      expect(createRoles).not.toContain(Role.VIEWER);
      expect(updateRoles).not.toContain(Role.VIEWER);
      expect(deleteRoles).not.toContain(Role.VIEWER);
    });

    it('should allow VIEWER read access to list and detail endpoints', () => {
      const findAllRoles = reflector.get<Role[]>(ROLES_KEY, controller.findAll);
      const findByIdRoles = reflector.get<Role[]>(ROLES_KEY, controller.findById);

      expect(findAllRoles).toContain(Role.VIEWER);
      expect(findByIdRoles).toContain(Role.VIEWER);
    });
  });

  describe('Endpoints delegation', () => {
    it('create should delegate to casesService.create with payload and user', async () => {
      const createDto = {
        title: 'New Incident',
        description: 'Forensic acquisition',
      };

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(mockCaseResponse);
      expect(mockCasesService.create).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('findAll should delegate to casesService.findAll with query parameters', async () => {
      const query = { page: 1, limit: 10, search: 'Incident' };
      const result = await controller.findAll(query);

      expect(result.items).toHaveLength(1);
      expect(mockCasesService.findAll).toHaveBeenCalledWith(query);
    });

    it('findById should delegate to casesService.findById with case id', async () => {
      const result = await controller.findById('66da81234abcd5678ef05678');

      expect(result).toEqual(mockCaseResponse);
      expect(mockCasesService.findById).toHaveBeenCalledWith(
        '66da81234abcd5678ef05678',
      );
    });

    it('update should delegate to casesService.update with id, payload, and user', async () => {
      const updateDto = { title: 'Updated Case Title' };
      const result = await controller.update(
        '66da81234abcd5678ef05678',
        updateDto,
        mockUser,
      );

      expect(result.title).toBe('Updated Case Title');
      expect(mockCasesService.update).toHaveBeenCalledWith(
        '66da81234abcd5678ef05678',
        updateDto,
        mockUser,
      );
    });

    it('delete should delegate to casesService.delete with id and user', async () => {
      const result = await controller.delete('66da81234abcd5678ef05678', mockUser);

      expect(result.deleted).toBe(true);
      expect(mockCasesService.delete).toHaveBeenCalledWith(
        '66da81234abcd5678ef05678',
        mockUser,
      );
    });
  });
});
