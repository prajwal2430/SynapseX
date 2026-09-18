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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const user_schema_1 = require("./schemas/user.schema");
const role_enum_1 = require("../../common/enums/role.enum");
let AuthService = AuthService_1 = class AuthService {
    constructor(userModel, jwtService, configService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.saltRounds = 12;
    }
    async register(registerDto) {
        const normalizedEmail = registerDto.email.trim().toLowerCase();
        const existingUser = await this.userModel
            .findOne({ email: normalizedEmail })
            .exec();
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email address already exists');
        }
        const passwordHash = await bcrypt.hash(registerDto.password, this.saltRounds);
        const newUser = new this.userModel({
            email: normalizedEmail,
            name: registerDto.name.trim(),
            passwordHash,
            role: registerDto.role || role_enum_1.Role.INVESTIGATOR,
            isActive: true,
            refreshTokenHash: null,
        });
        const savedUser = await newUser.save();
        this.logger.log(`New user registered: ${savedUser.email} (ID: ${savedUser._id})`);
        const tokens = await this.generateAndStoreTokens(savedUser);
        return {
            ...tokens,
            user: this.mapToUserProfile(savedUser),
        };
    }
    async login(loginDto) {
        const normalizedEmail = loginDto.email.trim().toLowerCase();
        const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            this.logger.warn(`Login attempt for inactive account: ${user.email}`);
            throw new common_1.UnauthorizedException('Your account has been deactivated. Please contact an administrator.');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        this.logger.log(`User logged in: ${user.email}`);
        const tokens = await this.generateAndStoreTokens(user);
        return {
            ...tokens,
            user: this.mapToUserProfile(user),
        };
    }
    async refreshToken(refreshTokenDto) {
        const refreshSecret = this.configService.get('app.jwt.refreshSecret', 'dev-insecure-jwt-refresh-secret-min-32-chars-synapsex');
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
                secret: refreshSecret,
            });
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.userModel.findById(payload.sub).exec();
        if (!user) {
            throw new common_1.UnauthorizedException('User account no longer exists');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account has been deactivated');
        }
        if (!user.refreshTokenHash) {
            this.logger.warn(`Revoked refresh token presented for user: ${user.email}`);
            throw new common_1.UnauthorizedException('Refresh token has been revoked. Please log in again.');
        }
        const isMatch = await bcrypt.compare(refreshTokenDto.refreshToken, user.refreshTokenHash);
        if (!isMatch) {
            this.logger.warn(`Mismatched refresh token for user: ${user.email}`);
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.generateAndStoreTokens(user);
        return {
            ...tokens,
            user: this.mapToUserProfile(user),
        };
    }
    async logout(userId) {
        await this.userModel
            .findByIdAndUpdate(userId, { refreshTokenHash: null })
            .exec();
        this.logger.log(`User logged out and session revoked for user ID: ${userId}`);
        return {
            loggedOut: true,
            message: 'Session and refresh token successfully revoked',
        };
    }
    async generateAndStoreTokens(user) {
        const accessSecret = this.configService.get('app.jwt.accessSecret', 'dev-insecure-jwt-secret-min-32-chars-synapsex');
        const accessExpiresIn = this.configService.get('app.jwt.accessExpiresIn', '15m');
        const refreshSecret = this.configService.get('app.jwt.refreshSecret', 'dev-insecure-jwt-refresh-secret-min-32-chars-synapsex');
        const refreshExpiresIn = this.configService.get('app.jwt.refreshExpiresIn', '7d');
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: accessSecret,
                expiresIn: accessExpiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: refreshExpiresIn,
            }),
        ]);
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        user.refreshTokenHash = refreshTokenHash;
        await user.save();
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: accessExpiresIn,
        };
    }
    mapToUserProfile(user) {
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map