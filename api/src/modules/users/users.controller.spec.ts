import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let reflector: Reflector;

  const mockUserProfile = {
    id: '66da81234abcd5678ef01234',
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue({
      items: [mockUserProfile],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    findById: jest.fn().mockResolvedValue(mockUserProfile),
    update: jest.fn().mockResolvedValue({
      ...mockUserProfile,
      name: 'Alex Updated',
    }),
    updateStatus: jest.fn().mockResolvedValue({
      ...mockUserProfile,
      isActive: false,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        Reflector,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should have @Roles(Role.ADMIN) attached to all user management endpoints', () => {
    const findAllRoles = reflector.get<Role[]>(ROLES_KEY, controller.findAll);
    const findByIdRoles = reflector.get<Role[]>(ROLES_KEY, controller.findById);
    const updateRoles = reflector.get<Role[]>(ROLES_KEY, controller.update);
    const updateStatusRoles = reflector.get<Role[]>(
      ROLES_KEY,
      controller.updateStatus,
    );

    expect(findAllRoles).toEqual([Role.ADMIN]);
    expect(findByIdRoles).toEqual([Role.ADMIN]);
    expect(updateRoles).toEqual([Role.ADMIN]);
    expect(updateStatusRoles).toEqual([Role.ADMIN]);
  });

  it('findAll should call usersService.findAll with query parameters', async () => {
    const query = { page: 1, limit: 10, role: Role.INVESTIGATOR };
    const result = await controller.findAll(query);

    expect(result.items).toHaveLength(1);
    expect(mockUsersService.findAll).toHaveBeenCalledWith(query);
  });

  it('findById should call usersService.findById with user id', async () => {
    const result = await controller.findById('66da81234abcd5678ef01234');

    expect(result).toEqual(mockUserProfile);
    expect(mockUsersService.findById).toHaveBeenCalledWith(
      '66da81234abcd5678ef01234',
    );
  });

  it('update should call usersService.update with id and payload', async () => {
    const updateDto = { name: 'Alex Updated' };
    const result = await controller.update('66da81234abcd5678ef01234', updateDto);

    expect(result.name).toBe('Alex Updated');
    expect(mockUsersService.update).toHaveBeenCalledWith(
      '66da81234abcd5678ef01234',
      updateDto,
    );
  });

  it('updateStatus should call usersService.updateStatus with id and isActive flag', async () => {
    const statusDto = { isActive: false };
    const result = await controller.updateStatus(
      '66da81234abcd5678ef01234',
      statusDto,
    );

    expect(result.isActive).toBe(false);
    expect(mockUsersService.updateStatus).toHaveBeenCalledWith(
      '66da81234abcd5678ef01234',
      statusDto,
    );
  });
});
