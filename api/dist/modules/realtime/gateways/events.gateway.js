"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../auth/schemas/user.schema");
const case_schema_1 = require("../../cases/schemas/case.schema");
const role_enum_1 = require("../../../common/enums/role.enum");
const realtime_constants_1 = require("../constants/realtime.constants");
let EventsGateway = EventsGateway_1 = class EventsGateway {
    constructor(jwtService, configService, userModel, caseModel) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.userModel = userModel;
        this.caseModel = caseModel;
        this.logger = new common_1.Logger(EventsGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                this.logger.warn(`[WS UNAUTHORIZED] Connection attempt without token from ${client.id}`);
                client.emit('error:authentication', { message: 'Authentication token required' });
                client.disconnect(true);
                return;
            }
            const secret = this.configService.get('app.jwt.accessSecret', 'dev-insecure-jwt-secret-min-32-chars-synapsex');
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
            client.data.user = {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
            };
            this.logger.log(`[WS CONNECTED] User ${user.email} (${user.role}) connected on socket ${client.id}`);
        }
        catch (err) {
            this.logger.warn(`[WS AUTH ERROR] Handshake auth failed for client ${client.id}: ${err.message}`);
            client.emit('error:authentication', { message: 'Authentication verification failed' });
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const user = client.data?.user;
        this.logger.log(`[WS DISCONNECTED] Socket ${client.id} disconnected ${user ? `(User: ${user.email})` : ''}`);
    }
    async handleJoinCase(client, data) {
        const user = client.data?.user;
        if (!user) {
            return { success: false, error: 'Unauthenticated client' };
        }
        const caseId = data?.caseId;
        if (!caseId || !mongoose_2.Types.ObjectId.isValid(caseId)) {
            return { success: false, error: `Invalid or missing caseId: '${caseId}'` };
        }
        const caseDoc = await this.caseModel.findById(caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            return { success: false, error: `Case with ID '${caseId}' not found` };
        }
        const isAuthorized = user.role === role_enum_1.Role.ADMIN ||
            caseDoc.createdBy.toString() === user.id ||
            caseDoc.assignedUsers.some((u) => u.toString() === user.id);
        if (!isAuthorized) {
            this.logger.warn(`[WS FORBIDDEN] User ${user.email} attempted unauthorized join for case ${caseId}`);
            return {
                success: false,
                error: 'Forbidden: You do not have permission to access events for this case',
            };
        }
        const room = (0, realtime_constants_1.getCaseRoom)(caseId);
        client.join(room);
        this.logger.log(`[WS ROOM JOINED] User ${user.email} joined room '${room}'`);
        return { success: true, room };
    }
    handleLeaveCase(client, data) {
        const caseId = data?.caseId;
        const room = (0, realtime_constants_1.getCaseRoom)(caseId);
        client.leave(room);
        this.logger.log(`[WS ROOM LEFT] Socket ${client.id} left room '${room}'`);
        return { success: true, room };
    }
    extractToken(client) {
        const authHeader = client.handshake.auth?.token;
        if (authHeader) {
            return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
        }
        const headerAuth = client.handshake.headers?.authorization;
        if (headerAuth) {
            return headerAuth.startsWith('Bearer ') ? headerAuth.substring(7) : headerAuth;
        }
        const queryToken = client.handshake.query?.token;
        if (typeof queryToken === 'string') {
            return queryToken.startsWith('Bearer ') ? queryToken.substring(7) : queryToken;
        }
        return null;
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(realtime_constants_1.REALTIME_EVENTS.JOIN_CASE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleJoinCase", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(realtime_constants_1.REALTIME_EVENTS.LEAVE_CASE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Object)
], EventsGateway.prototype, "handleLeaveCase", null);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map