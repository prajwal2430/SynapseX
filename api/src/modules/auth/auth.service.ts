import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from '../../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthResponseDto,
  AuthTokensDto,
  LogoutResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user account with hashed password and initial auth tokens.
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .exec();

    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    // Hash plain password with bcrypt
    const passwordHash = await bcrypt.hash(registerDto.password, this.saltRounds);

    // Create user entity
    const newUser = new this.userModel({
      email: normalizedEmail,
      name: registerDto.name.trim(),
      passwordHash,
      role: registerDto.role || Role.INVESTIGATOR,
      isActive: true,
      refreshTokenHash: null,
    });

    const savedUser = await newUser.save();
    this.logger.log(`New user registered: ${savedUser.email} (ID: ${savedUser._id})`);

    // Generate tokens and update refresh token hash
    const tokens = await this.generateAndStoreTokens(savedUser);

    return {
      ...tokens,
      user: this.mapToUserProfile(savedUser),
    };
  }

  /**
   * Authenticates user credentials, enforces active status, and returns auth tokens.
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();

    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Enforce active account status
    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive account: ${user.email}`);
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact an administrator.',
      );
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${user.email}`);

    // Generate fresh tokens and rotate refresh token hash
    const tokens = await this.generateAndStoreTokens(user);

    return {
      ...tokens,
      user: this.mapToUserProfile(user),
    };
  }

  /**
   * Validates and rotates an existing refresh token, enforcing revocation checks.
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshSecret = this.configService.get<string>(
      'app.jwt.refreshSecret',
      'dev-insecure-jwt-refresh-secret-min-32-chars-synapsex',
    );

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: refreshSecret,
        },
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(payload.sub).exec();

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Token revocation check: if user logged out or token was invalidated
    if (!user.refreshTokenHash) {
      this.logger.warn(`Revoked refresh token presented for user: ${user.email}`);
      throw new UnauthorizedException(
        'Refresh token has been revoked. Please log in again.',
      );
    }

    // Compare provided token against stored hash
    const isMatch = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      user.refreshTokenHash,
    );

    if (!isMatch) {
      this.logger.warn(`Mismatched refresh token for user: ${user.email}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate tokens (generate new access + new refresh, invalidate previous)
    const tokens = await this.generateAndStoreTokens(user);

    return {
      ...tokens,
      user: this.mapToUserProfile(user),
    };
  }

  /**
   * Revokes the user's active refresh token, rendering it unusable.
   */
  async logout(userId: string): Promise<LogoutResponseDto> {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: null })
      .exec();

    this.logger.log(`User logged out and session revoked for user ID: ${userId}`);

    return {
      loggedOut: true,
      message: 'Session and refresh token successfully revoked',
    };
  }

  /**
   * Helper to sign access + refresh token pair and persist the hashed refresh token.
   */
  private async generateAndStoreTokens(
    user: UserDocument,
  ): Promise<AuthTokensDto> {
    const accessSecret = this.configService.get<string>(
      'app.jwt.accessSecret',
      'dev-insecure-jwt-secret-min-32-chars-synapsex',
    );
    const accessExpiresIn = this.configService.get<string>(
      'app.jwt.accessExpiresIn',
      '15m',
    );
    const refreshSecret = this.configService.get<string>(
      'app.jwt.refreshSecret',
      'dev-insecure-jwt-refresh-secret-min-32-chars-synapsex',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'app.jwt.refreshExpiresIn',
      '7d',
    );

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

    // Store hashed refresh token in database for revocability and rotation
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

  private mapToUserProfile(user: UserDocument): UserProfileDto {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
