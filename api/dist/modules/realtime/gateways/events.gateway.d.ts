import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { UserDocument } from '../../auth/schemas/user.schema';
import { CaseDocument } from '../../cases/schemas/case.schema';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly userModel;
    private readonly caseModel;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, configService: ConfigService, userModel: Model<UserDocument>, caseModel: Model<CaseDocument>);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinCase(client: Socket, data: {
        caseId: string;
    }): Promise<{
        success: boolean;
        room?: string;
        error?: string;
    }>;
    handleLeaveCase(client: Socket, data: {
        caseId: string;
    }): {
        success: boolean;
        room: string;
    };
    private extractToken;
}
