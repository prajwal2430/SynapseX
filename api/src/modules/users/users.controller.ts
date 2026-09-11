import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all users with pagination and filtering (ADMIN only)',
    description: 'Retrieves users with optional role and status filtering. Restricted to users with the ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not possess ADMIN role',
  })
  async findAll(
    @Query() query: UserQueryDto,
  ): Promise<PaginatedResult<UserProfileDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Retrieve a specific user profile by ID (ADMIN only)',
    description: 'Retrieves full user metadata by MongoDB ObjectId. Requires ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findById(@Param('id') id: string): Promise<UserProfileDto> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user details and assigned role (ADMIN only)',
    description: 'Modifies user name, email address, or platform role. Restricted to ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user to update' })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already in use by another account',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate or deactivate a user account (ADMIN only)',
    description: 'Enables or disables an investigator account. Deactivating immediately revokes all active refresh tokens.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({
    status: 200,
    description: 'User status successfully updated',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateUserStatusDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateStatus(id, statusDto);
  }
}
