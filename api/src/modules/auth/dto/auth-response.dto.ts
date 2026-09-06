import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class UserProfileDto {
  @ApiProperty({ example: '66da81234abcd5678ef01234' })
  id: string;

  @ApiProperty({ example: 'investigator@synapsex.local' })
  email: string;

  @ApiProperty({ example: 'Alex Mercer' })
  name: string;

  @ApiProperty({ example: Role.INVESTIGATOR, enum: Role })
  role: Role;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token (short-lived)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token (long-lived, revocable)',
  })
  refreshToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: '15m' })
  expiresIn: string;
}

export class AuthResponseDto extends AuthTokensDto {
  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  loggedOut: boolean;

  @ApiProperty({ example: 'Session and refresh token successfully revoked' })
  message: string;
}
