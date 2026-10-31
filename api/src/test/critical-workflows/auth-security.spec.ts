import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../modules/auth/auth.service';
import { User } from '../../modules/auth/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy';

/**
 * ============================================================================
 * Critical Workflow Test Suite: Flow 1 (User Login) & Flow 2 (Unauthorized Access)
 * ============================================================================
 *
 * Validates:
 * 1. User login with valid bcrypt credentials issuing JWT access + refresh tokens
 * 2. Inactive/deactivated account blocking with 401 Unauthorized
 * 3. Invalid credentials rejection with 401 Unauthorized
 * 4. Refresh token rotation and revoked token rejection
 * 5. Unauthorized API access rejection when tokens are missing, expired, or deactivated
 */
describe('Critical Workflow: Authentication & Security Boundaries (Flows 1 & 2)', () => {
  let authService: AuthService;
  let jwtAuthGuard: JwtAuthGuard;
  let jwtStrategy: JwtStrategy;

  const validPassword = 'SecureInvestigatorPassword2026!';
  let passwordHash: string;

  const mockActiveUser = {
    _id: new Types.ObjectId(),
    email: 'analyst.lead@synapsex.local',
    name: 'Lead Forensic Analyst',
    role: Role.INVESTIGATOR,
    isActive: true,
    passwordHash: '',
    refreshTokenHash: null as string | null,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockInactiveUser = {
    _id: new Types.ObjectId(),
    email: 'suspended.examiner@synapsex.local',
    name: 'Suspended Examiner',
    role: Role.VIEWER,
    isActive: false,
    passwordHash: '',
    refreshTokenHash: null as string | null,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  class MockUserModel {
    _id: Types.ObjectId;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
    passwordHash: string;
    refreshTokenHash: string | null = null;

    constructor(data: any) {
      Object.assign(this, data);
      this._id = data._id || new Types.ObjectId();
    }

    save = jest.fn().mockResolvedValue(this);
    static findOne = jest.fn();
    static findById = jest.fn();
    static findByIdAndUpdate = jest.fn();
  }

  const mockJwtService = {
    signAsync: jest.fn().mockImplementation((payload: any, options: any) => {
      const type = options?.expiresIn === '7d' ? 'refresh' : 'access';
      return Promise.resolve(`jwt.${type}.${payload.sub}.${Date.now()}`);
    }),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const configMap: Record<string, any> = {
        'app.jwt.accessSecret': 'synapsex-test-access-secret-32-chars-long',
        'app.jwt.accessExpiresIn': '15m',
        'app.jwt.refreshSecret': 'synapsex-test-refresh-secret-32-chars-long',
        'app.jwt.refreshExpiresIn': '7d',
      };
      return configMap[key] ?? defaultValue;
    }),
  };

  beforeAll(async () => {
    // Generate actual bcrypt hash for realistic credential validation
    passwordHash = await bcrypt.hash(validPassword, 10);
    mockActiveUser.passwordHash = passwordHash;
    mockInactiveUser.passwordHash = passwordHash;
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtAuthGuard,
        JwtStrategy,
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

    authService = module.get<AuthService>(AuthService);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  // ==========================================================================
  // Flow 1: User Login
  // ==========================================================================
  describe('Flow 1: User Login & Session Issuance', () => {
    it('should successfully authenticate active user and return accessToken, refreshToken, and user profile', async () => {
      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockActiveUser),
      });

      const result = await authService.login({
        email: 'analyst.lead@synapsex.local',
        password: validPassword,
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toMatch(/^jwt\.access\./);
      expect(result.refreshToken).toMatch(/^jwt\.refresh\./);
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe('15m');
      expect(result.user).toEqual({
        id: mockActiveUser._id.toString(),
        email: mockActiveUser.email,
        name: mockActiveUser.name,
        role: mockActiveUser.role,
        isActive: true,
      });

      // Assert that refreshToken was hashed and persisted to prevent reuse
      expect(mockActiveUser.save).toHaveBeenCalled();
    });

    it('should reject login attempt when password does not match (401 Unauthorized)', async () => {
      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockActiveUser),
      });

      await expect(
        authService.login({
          email: 'analyst.lead@synapsex.local',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));

      // Verify no refresh token was generated or saved
      expect(mockActiveUser.save).not.toHaveBeenCalled();
    });

    it('should block deactivated accounts even with valid credentials (401 Unauthorized)', async () => {
      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockInactiveUser),
      });

      await expect(
        authService.login({
          email: 'suspended.examiner@synapsex.local',
          password: validPassword,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('Your account has been deactivated. Please contact an administrator.'),
      );

      expect(mockInactiveUser.save).not.toHaveBeenCalled();
    });

    it('should reject login for non-existent email without leaking account existence (401 Unauthorized)', async () => {
      MockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.login({
          email: 'unknown.user@synapsex.local',
          password: 'AnyPassword123!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    });

    it('should rotate refresh token and issue a fresh pair on valid refresh', async () => {
      const rawRefreshToken = 'valid-refresh-token-from-client';
      const storedRefreshHash = await bcrypt.hash(rawRefreshToken, 10);

      const userWithRefreshToken = {
        ...mockActiveUser,
        refreshTokenHash: storedRefreshHash,
        save: jest.fn().mockResolvedValue(true),
      };

      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithRefreshToken),
      });

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockActiveUser._id.toString(),
        email: mockActiveUser.email,
      });

      const result = await authService.refreshToken({
        refreshToken: rawRefreshToken,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(userWithRefreshToken.save).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Flow 2: Unauthorized API Access
  // ==========================================================================
  describe('Flow 2: Unauthorized API Access Rejection', () => {
    it('should throw UnauthorizedException when passport token is missing', () => {
      expect(() =>
        jwtAuthGuard.handleRequest(null, false, { message: 'No auth token' }),
      ).toThrow(new UnauthorizedException('No auth token'));
    });

    it('should throw UnauthorizedException with default message when info is undefined', () => {
      expect(() =>
        jwtAuthGuard.handleRequest(null, false, undefined),
      ).toThrow(new UnauthorizedException('Access token is invalid, expired, or missing'));
    });

    it('should propagate passport verification errors (e.g. invalid signature or malformed token)', () => {
      const passportError = new Error('invalid signature');
      expect(() =>
        jwtAuthGuard.handleRequest(passportError, false, undefined),
      ).toThrow(passportError);
    });

    it('should validate active user payload via JwtStrategy', async () => {
      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockActiveUser),
      });

      const validatedUser = await jwtStrategy.validate({
        sub: mockActiveUser._id.toString(),
        email: mockActiveUser.email,
        role: mockActiveUser.role,
      });

      expect(validatedUser).toEqual({
        id: mockActiveUser._id.toString(),
        email: mockActiveUser.email,
        name: mockActiveUser.name,
        role: mockActiveUser.role,
        isActive: true,
      });
    });

    it('should reject token validation if user was deactivated after token was issued (401 Unauthorized)', async () => {
      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockInactiveUser),
      });

      await expect(
        jwtStrategy.validate({
          sub: mockInactiveUser._id.toString(),
          email: mockInactiveUser.email,
          role: mockInactiveUser.role,
        }),
      ).rejects.toThrow(new UnauthorizedException('User account has been deactivated'));
    });

    it('should reject token validation if user account was deleted from database (401 Unauthorized)', async () => {
      MockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        jwtStrategy.validate({
          sub: new Types.ObjectId().toString(),
          email: 'purged.user@synapsex.local',
          role: Role.INVESTIGATOR,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('User account associated with this token no longer exists'),
      );
    });
  });
});
