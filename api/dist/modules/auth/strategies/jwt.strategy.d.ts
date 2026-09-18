import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
import { Role } from '../../../common/enums/role.enum';
export interface JwtPayload {
    sub: string;
    email: string;
    role?: Role;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly userModel;
    constructor(configService: ConfigService, userModel: Model<UserDocument>);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        name: string;
        role: Role;
        isActive: true;
    }>;
}
export {};
