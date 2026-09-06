import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required on handler or class', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext({
      id: '1',
      role: Role.VIEWER,
    });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access if user has required role (ADMIN)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext({
      id: '1',
      email: 'admin@synapsex.local',
      role: Role.ADMIN,
    });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access if user has one of several permitted roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ADMIN, Role.INVESTIGATOR]);

    const context = createMockExecutionContext({
      id: '1',
      email: 'investigator@synapsex.local',
      role: Role.INVESTIGATOR,
    });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if no user is attached to request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no role defined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext({
      id: '1',
      email: 'norole@synapsex.local',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user role does not match required role (INVESTIGATOR accessing ADMIN route)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext({
      id: '2',
      email: 'investigator@synapsex.local',
      role: Role.INVESTIGATOR,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(/Required role \(ADMIN\) not met by user role \(INVESTIGATOR\)/);
  });

  it('should throw ForbiddenException if user is VIEWER attempting access to ANALYST route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ANALYST]);

    const context = createMockExecutionContext({
      id: '3',
      email: 'viewer@synapsex.local',
      role: Role.VIEWER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
