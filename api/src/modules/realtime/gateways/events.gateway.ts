import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseFilters } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { Case, CaseDocument } from '../../cases/schemas/case.schema';
import { Role } from '../../../common/enums/role.enum';
import { REALTIME_EVENTS, getCaseRoom } from '../constants/realtime.constants';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
  ) {}

  /**
   * Authenticates incoming WebSocket handshake connections.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`[WS UNAUTHORIZED] Connection attempt without token from ${client.id}`);
        client.emit('error:authentication', { message: 'Authentication token required' });
        client.disconnect(true);
        return;
      }

      const secret = this.configService.get<string>(
        'app.jwt.accessSecret',
        'dev-insecure-jwt-secret-min-32-chars-synapsex',
      );

      const payload = await this.jwtService.verifyAsync(token, { secret });
      if (!payload || !payload.sub) {
        this.logger.warn(`[WS UNAUTHORIZED] Invalid token payload from ${client.id}`);
        client.emit('error:authentication', { message: 'Invalid token payload' });
        client.disconnect(true);
        return;
      }

      const user = await this.userModel.findById(payload.sub).exec();
      if (!user || !user.isActive) {
        this.logger.warn(`[WS UNAUTHORIZED] Inactive or non-existent user ${payload.sub} for client ${client.id}`);
        client.emit('error:authentication', { message: 'User account not active' });
        client.disconnect(true);
        return;
      }

      // Attach user profile to socket instance
      client.data.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      };

      this.logger.log(`[WS CONNECTED] User ${user.email} (${user.role}) connected on socket ${client.id}`);
    } catch (err: any) {
      this.logger.warn(`[WS AUTH ERROR] Handshake auth failed for client ${client.id}: ${err.message}`);
      client.emit('error:authentication', { message: 'Authentication verification failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data?.user;
    this.logger.log(
      `[WS DISCONNECTED] Socket ${client.id} disconnected ${user ? `(User: ${user.email})` : ''}`,
    );
  }

  /**
   * Subscribes an authenticated client to a case-specific room.
   * Verifies that the user has explicit authorization to view the case.
   */
  @SubscribeMessage(REALTIME_EVENTS.JOIN_CASE)
  async handleJoinCase(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { caseId: string },
  ): Promise<{ success: boolean; room?: string; error?: string }> {
    const user = client.data?.user;
    if (!user) {
      return { success: false, error: 'Unauthenticated client' };
    }

    const caseId = data?.caseId;
    if (!caseId || !Types.ObjectId.isValid(caseId)) {
      return { success: false, error: `Invalid or missing caseId: '${caseId}'` };
    }

    const caseDoc = await this.caseModel.findById(caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      return { success: false, error: `Case with ID '${caseId}' not found` };
    }

    // RBAC and case membership validation
    const isAuthorized =
      user.role === Role.ADMIN ||
      caseDoc.createdBy.toString() === user.id ||
      caseDoc.assignedUsers.some((u) => u.toString() === user.id);

    if (!isAuthorized) {
      this.logger.warn(
        `[WS FORBIDDEN] User ${user.email} attempted unauthorized join for case ${caseId}`,
      );
      return {
        success: false,
        error: 'Forbidden: You do not have permission to access events for this case',
      };
    }

    const room = getCaseRoom(caseId);
    client.join(room);
    this.logger.log(`[WS ROOM JOINED] User ${user.email} joined room '${room}'`);

    return { success: true, room };
  }

  /**
   * Unsubscribes a client from a case-specific room.
   */
  @SubscribeMessage(REALTIME_EVENTS.LEAVE_CASE)
  handleLeaveCase(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { caseId: string },
  ): { success: boolean; room: string } {
    const caseId = data?.caseId;
    const room = getCaseRoom(caseId);
    client.leave(room);
    this.logger.log(`[WS ROOM LEFT] Socket ${client.id} left room '${room}'`);
    return { success: true, room };
  }

  /**
   * Extracts JWT token from handshake auth or headers.
   */
  private extractToken(client: Socket): string | null {
    // 1. Check handshake.auth (standard Socket.IO v4 client auth)
    const authHeader = client.handshake.auth?.token;
    if (authHeader) {
      return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    }

    // 2. Check handshake.headers.authorization
    const headerAuth = client.handshake.headers?.authorization;
    if (headerAuth) {
      return headerAuth.startsWith('Bearer ') ? headerAuth.substring(7) : headerAuth;
    }

    // 3. Fallback to handshake query parameter (for dev tools/Postman)
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken.startsWith('Bearer ') ? queryToken.substring(7) : queryToken;
    }

    return null;
  }
}
