import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../../common/enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    expiresIn: '15m',
    user: {
      id: '66da81234abcd5678ef01234',
      email: 'investigator@synapsex.local',
      name: 'Alex Mercer',
      role: Role.INVESTIGATOR,
      isActive: true,
    },
  };

  const mockAuthService = {
    register: jest.fn().mockResolvedValue(mockAuthResponse),
    login: jest.fn().mockResolvedValue(mockAuthResponse),
    refreshToken: jest.fn().mockResolvedValue(mockAuthResponse),
    logout: jest.fn().mockResolvedValue({
      loggedOut: true,
      message: 'Session and refresh token successfully revoked',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should call authService.register and return tokens with profile', async () => {
    const registerDto = {
      email: 'investigator@synapsex.local',
      password: 'SecurePassword123!',
      name: 'Alex Mercer',
    };

    const result = await controller.register(registerDto);

    expect(result).toEqual(mockAuthResponse);
    expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
  });

  it('should call authService.login and return tokens with profile', async () => {
    const loginDto = {
      email: 'investigator@synapsex.local',
      password: 'SecurePassword123!',
    };

    const result = await controller.login(loginDto);

    expect(result).toEqual(mockAuthResponse);
    expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
  });

  it('should call authService.refreshToken and return rotated tokens', async () => {
    const refreshDto = {
      refreshToken: 'valid-refresh-token',
    };

    const result = await controller.refresh(refreshDto);

    expect(result).toEqual(mockAuthResponse);
    expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshDto);
  });

  it('should call authService.logout and revoke session', async () => {
    const result = await controller.logout('66da81234abcd5678ef01234');

    expect(result.loggedOut).toBe(true);
    expect(mockAuthService.logout).toHaveBeenCalledWith('66da81234abcd5678ef01234');
  });

  it('should return user profile from getProfile', async () => {
    const profile = await controller.getProfile(mockAuthResponse.user);

    expect(profile).toEqual(mockAuthResponse.user);
  });
});
