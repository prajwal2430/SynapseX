import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

describe('AuthService', () => {
  jest.setTimeout(20000);
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    _id: '66da81234abcd5678ef01234',
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    passwordHash: '$2b$12$eX4mP1eH4sH3dValUeHere1234567890',
    isActive: true,
    refreshTokenHash: '$2b$10$r3fr3shT0k3nH4sh1234567890',
    save: jest.fn().mockResolvedValue(this),
  };

  class MockUserModel {
    _id: string = mockUser._id;
    email: string;
    name: string;
    passwordHash: string;
    isActive: boolean;
    refreshTokenHash: string | null;

    constructor(public data: any) {
      Object.assign(this, data);
      this._id = mockUser._id;
    }
    save = jest.fn().mockResolvedValue(this);
    static findOne = jest.fn();
    static findById = jest.fn();
    static findByIdAndUpdate = jest.fn();
  }

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'app.jwt.accessSecret') return 'test-access-secret';
      if (key === 'app.jwt.accessExpiresIn') return '15m';
      if (key === 'app.jwt.refreshSecret') return 'test-refresh-secret';
      if (key === 'app.jwt.refreshExpiresIn') return '7d';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user with hashed password and tokens', async () => {
      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const registerDto = {
        email: 'newuser@synapsex.local',
        password: 'SecurePassword123!',
        name: 'New Investigator',
      };

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('newuser@synapsex.local');
      expect(result.user.name).toBe('New Investigator');
      expect(result.user.isActive).toBe(true);
    });

    it('should throw ConflictException if user email already exists', async () => {
      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(
        service.register({
          email: 'investigator@synapsex.local',
          password: 'Password123!',
          name: 'Existing User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully authenticate active user with correct credentials', async () => {
      const plainPassword = 'CorrectPassword123!';
      const hash = await bcrypt.hash(plainPassword, 10);
      const testUser = {
        ...mockUser,
        passwordHash: hash,
        save: jest.fn().mockResolvedValue(this),
      };

      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      const result = await service.login({
        email: 'investigator@synapsex.local',
        password: plainPassword,
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if email is not found', async () => {
      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login({
          email: 'unknown@synapsex.local',
          password: 'AnyPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
      };

      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(inactiveUser),
      });

      await expect(
        service.login({
          email: 'investigator@synapsex.local',
          password: 'AnyPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 10);
      const testUser = {
        ...mockUser,
        passwordHash: hash,
      };

      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      await expect(
        service.login({
          email: 'investigator@synapsex.local',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should rotate tokens when provided a valid matching refresh token', async () => {
      const refreshTokenPlain = 'valid-refresh-token';
      const tokenHash = await bcrypt.hash(refreshTokenPlain, 10);
      const testUser = {
        ...mockUser,
        refreshTokenHash: tokenHash,
        save: jest.fn().mockResolvedValue(this),
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: testUser._id,
        email: testUser.email,
      });

      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      const result = await service.refreshToken({
        refreshToken: refreshTokenPlain,
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(testUser.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token was revoked (hash is null)', async () => {
      const testUser = {
        ...mockUser,
        refreshTokenHash: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: testUser._id,
        email: testUser.email,
      });

      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(testUser),
      });

      await expect(
        service.refreshToken({ refreshToken: 'any-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke user session by nullifying refreshTokenHash', async () => {
      MockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.logout(mockUser._id);

      expect(result.loggedOut).toBe(true);
      expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { refreshTokenHash: null },
      );
    });
  });
});
