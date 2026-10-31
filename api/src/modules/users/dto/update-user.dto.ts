import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Alex Mercer Updated',
    description: 'Updated full name of the user',
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'alex.updated@synapsex.local',
    description: 'Updated user email address',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: Role.ANALYST,
    enum: Role,
    description: 'Updated platform role assigned to the user',
  })
  @IsEnum(Role, { message: 'Role must be one of: ADMIN, INVESTIGATOR, ANALYST, REVIEWER, VIEWER' })
  @IsOptional()
  role?: Role;
}
