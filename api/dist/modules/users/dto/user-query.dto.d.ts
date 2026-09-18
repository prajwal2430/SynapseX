import { Role } from '../../../common/enums/role.enum';
export declare class UserQueryDto {
    page?: number;
    limit?: number;
    role?: Role;
    isActive?: boolean;
}
