import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthResponseDto,
  LogoutResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new investigator user account',
    description: 'Creates a user account, hashes password via bcrypt, and returns initial access and refresh tokens.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered and authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'A user with the specified email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Request payload failed validation constraints',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with email and password',
    description: 'Validates credentials, checks account active status, and returns a new access and refresh token pair.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or inactive account',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token using a valid refresh token',
    description: 'Verifies refresh token cryptographic signature, ensures token has not been revoked, and rotates the token pair.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed and rotated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or revoked refresh token',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke current session and refresh token',
    description: 'Requires valid JWT bearer token. Nullifies the stored refresh token hash, preventing further token refreshes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session successfully revoked',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing access token',
  })
  async logout(
    @CurrentUser('id') userId: string,
  ): Promise<LogoutResponseDto> {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Retrieve authenticated investigator profile',
    description: 'Validates the Bearer access token and returns the current user profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing access token',
  })
  async getProfile(@CurrentUser() user: UserProfileDto): Promise<UserProfileDto> {
    return user;
  }
}
