import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
export declare class AuthService {
    private readonly userModel;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly saltRounds;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto>;
    logout(userId: string): Promise<LogoutResponseDto>;
    private generateAndStoreTokens;
    private mapToUserProfile;
}
