import { Role } from '../../../common/enums/role.enum';
export declare class UserProfileDto {
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
}
export declare class AuthTokensDto {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: string;
}
export declare class AuthResponseDto extends AuthTokensDto {
    user: UserProfileDto;
}
export declare class LogoutResponseDto {
    loggedOut: boolean;
    message: string;
}
