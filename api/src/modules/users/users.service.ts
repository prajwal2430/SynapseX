import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Retrieves paginated list of users with optional filtering by role and status.
   */
  async findAll(query: UserQueryDto): Promise<PaginatedResult<UserProfileDto>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.role) {
      filter.role = query.role;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: users.map((u) => this.mapToUserProfile(u)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Finds a specific user by MongoDB ID.
   */
  async findById(id: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return this.mapToUserProfile(user);
  }

  /**
   * Updates user metadata (name, email, role).
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // If updating email, check for duplicate conflicts
    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
      const emailConflict = await this.userModel
        .findOne({
          email: updateUserDto.email.toLowerCase(),
          _id: { $ne: id },
        })
        .exec();

      if (emailConflict) {
        throw new ConflictException(
          `Email '${updateUserDto.email}' is already in use by another user`,
        );
      }
      user.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.name) {
      user.name = updateUserDto.name.trim();
    }

    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }

    const updatedUser = await user.save();
    this.logger.log(`User ID '${id}' updated by administrator`);

    return this.mapToUserProfile(updatedUser);
  }

  /**
   * Activates or deactivates a user account.
   * If deactivated, all active sessions and refresh tokens are immediately revoked.
   */
  async updateStatus(
    id: string,
    statusDto: UpdateUserStatusDto,
  ): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    user.isActive = statusDto.isActive;

    // Immediately revoke sessions upon deactivation
    if (!statusDto.isActive) {
      user.refreshTokenHash = null;
      this.logger.warn(`User ID '${id}' deactivated and refresh tokens revoked`);
    } else {
      this.logger.log(`User ID '${id}' reactivated`);
    }

    const savedUser = await user.save();
    return this.mapToUserProfile(savedUser);
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
