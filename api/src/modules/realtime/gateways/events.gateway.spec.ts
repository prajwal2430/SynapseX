import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { EventsGateway } from './events.gateway';
import { User } from '../../auth/schemas/user.schema';
import { Case } from '../../cases/schemas/case.schema';
import { Role } from '../../../common/enums/role.enum';
import { getCaseRoom, REALTIME_EVENTS } from '../constants/realtime.constants';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockJwtService: Partial<JwtService>;
  let mockConfigService: Partial<ConfigService>;
  let mockUserModel: any;
  let mockCaseModel: any;

  const validUserId = new Types.ObjectId().toString();
  const validCaseId = new Types.ObjectId().toString();
  const creatorUserId = new Types.ObjectId().toString();

  const mockUserDoc = {
    _id: new Types.ObjectId(validUserId),
    email: 'analyst@synapsex.local',
    name: 'Analyst Jane',
    role: Role.ANALYST,
    isActive: true,
  };

  const mockCaseDoc = {
    _id: new Types.ObjectId(validCaseId),
    caseNumber: 'CASE-2026-999',
    title: 'Operation Red Horizon',
    createdBy: new Types.ObjectId(creatorUserId),
    assignedUsers: [new Types.ObjectId(validUserId)],
    isDeleted: false,
  };

  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      id: 'socket-client-1',
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
      },
      data: {},
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    };

    mockJwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: validUserId,
        email: mockUserDoc.email,
        role: mockUserDoc.role,
      }),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret-key-min-32-chars-long'),
    };

    mockUserModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      }),
    };

    mockCaseModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Case.name), useValue: mockCaseModel },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate client successfully with valid token in auth', async () => {
      await gateway.handleConnection(mockClient);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret-key-min-32-chars-long',
      });
      expect(mockUserModel.findById).toHaveBeenCalledWith(validUserId);
      expect(mockClient.data.user).toEqual({
        id: validUserId,
        email: mockUserDoc.email,
        name: mockUserDoc.name,
        role: mockUserDoc.role,
        isActive: true,
      });
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it('should authenticate client with Bearer prefix in headers', async () => {
      mockClient.handshake.auth = {};
      mockClient.handshake.headers = { authorization: 'Bearer token-from-header' };

      await gateway.handleConnection(mockClient);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('token-from-header', expect.any(Object));
      expect(mockClient.data.user).toBeDefined();
    });

    it('should disconnect client if no token provided', async () => {
      mockClient.handshake.auth = {};
      mockClient.handshake.headers = {};

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error:authentication', {
        message: 'Authentication token required',
      });
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect client if token verification fails', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(new Error('jwt expired'));

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error:authentication', {
        message: 'Authentication verification failed',
      });
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect client if user is inactive', async () => {
      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ ...mockUserDoc, isActive: false }),
      });

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error:authentication', {
        message: 'User account not active',
      });
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect cleanly', () => {
      mockClient.data.user = { email: 'analyst@synapsex.local' };
      expect(() => gateway.handleDisconnect(mockClient)).not.toThrow();
    });
  });

  describe('handleJoinCase', () => {
    beforeEach(() => {
      mockClient.data.user = {
        id: validUserId,
        email: mockUserDoc.email,
        name: mockUserDoc.name,
        role: Role.ANALYST,
        isActive: true,
      };
    });

    it('should reject unauthenticated client', async () => {
      mockClient.data.user = null;

      const result = await gateway.handleJoinCase(mockClient, { caseId: validCaseId });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated client');
    });

    it('should reject invalid caseId format', async () => {
      const result = await gateway.handleJoinCase(mockClient, { caseId: 'invalid-id' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or missing caseId');
    });

    it('should reject non-existent case', async () => {
      mockCaseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await gateway.handleJoinCase(mockClient, { caseId: validCaseId });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should allow assigned user to join case room', async () => {
      const result = await gateway.handleJoinCase(mockClient, { caseId: validCaseId });

      expect(result.success).toBe(true);
      expect(result.room).toBe(getCaseRoom(validCaseId));
      expect(mockClient.join).toHaveBeenCalledWith(getCaseRoom(validCaseId));
    });

    it('should allow ADMIN to join any case room', async () => {
      mockClient.data.user.role = Role.ADMIN;
      mockClient.data.user.id = 'unassigned-admin-id';

      const result = await gateway.handleJoinCase(mockClient, { caseId: validCaseId });

      expect(result.success).toBe(true);
      expect(mockClient.join).toHaveBeenCalledWith(getCaseRoom(validCaseId));
    });

    it('should allow case creator to join case room', async () => {
      mockClient.data.user.id = creatorUserId;

      const result = await gateway.handleJoinCase(mockClient, { caseId: validCaseId });

      expect(result.success).toBe(true);
      expect(mockClient.join).toHaveBeenCalledWith(getCaseRoom(validCaseId));
    });

    it('should forbid unassigned, non-admin user from joining case room', async () => {
      mockClient.data.user.id = 'outsider-user-id';
      mockClient.data.user.role = Role.INVESTIGATOR;

      const result = await gateway.handleJoinCase(mockClient, { caseId: validCaseId });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Forbidden');
      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveCase', () => {
    it('should leave case room successfully', () => {
      const result = gateway.handleLeaveCase(mockClient, { caseId: validCaseId });

      expect(result.success).toBe(true);
      expect(result.room).toBe(getCaseRoom(validCaseId));
      expect(mockClient.leave).toHaveBeenCalledWith(getCaseRoom(validCaseId));
    });
  });
});
