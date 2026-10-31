import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from '../auth/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: '66da81234abcd5678ef01234',
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
    refreshTokenHash: 'mock-hash',
    save: jest.fn().mockResolvedValue(this),
  };

  class MockUserModel {
    _id = mockUser._id;
    email = mockUser.email;
    name = mockUser.name;
    role = mockUser.role;
    isActive = mockUser.isActive;
    refreshTokenHash = mockUser.refreshTokenHash;

    constructor(public data: any) {
      Object.assign(this, data);
    }
    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
    static findById = jest.fn();
    static findOne = jest.fn();
    static countDocuments = jest.fn();
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of users', async () => {
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser]),
      };

      MockUserModel.find.mockReturnValue(mockQueryChain);
      MockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.items[0].email).toBe(mockUser.email);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findById(mockUser._id);

      expect(result.id).toBe(mockUser._id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user name and role', async () => {
      const testUser = {
        ...mockUser,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      const result = await service.update(mockUser._id, {
        name: 'Alex Updated',
        role: Role.ADMIN,
      });

      expect(result.name).toBe('Alex Updated');
      expect(result.role).toBe(Role.ADMIN);
      expect(testUser.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if updated email belongs to another user', async () => {
      const testUser = {
        ...mockUser,
        save: jest.fn(),
      };

      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'other-user-id' }),
      });

      await expect(
        service.update(mockUser._id, { email: 'taken@synapsex.local' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should deactivate user and revoke refresh token hash', async () => {
      const testUser = {
        ...mockUser,
        isActive: true,
        refreshTokenHash: 'valid-hash',
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      const result = await service.updateStatus(mockUser._id, {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
      expect(testUser.refreshTokenHash).toBeNull();
      expect(testUser.save).toHaveBeenCalled();
    });

    it('should reactivate an inactive user', async () => {
      const testUser = {
        ...mockUser,
        isActive: false,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      const result = await service.updateStatus(mockUser._id, {
        isActive: true,
      });

      expect(result.isActive).toBe(true);
    });
  });
});
