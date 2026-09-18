import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: UserQueryDto): Promise<PaginatedResult<UserProfileDto>>;
    findById(id: string): Promise<UserProfileDto>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserProfileDto>;
    updateStatus(id: string, statusDto: UpdateUserStatusDto): Promise<UserProfileDto>;
}
