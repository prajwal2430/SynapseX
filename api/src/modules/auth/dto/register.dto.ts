import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'investigator@synapsex.local',
    description: 'Valid, unique user email address',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password containing at least 8 characters',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: 'Alex Mercer',
    description: 'Full name of the user',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiPropertyOptional({
    example: Role.INVESTIGATOR,
    enum: Role,
    description: 'Platform access role (defaults to INVESTIGATOR)',
  })
  @IsEnum(Role, { message: 'Role must be one of: ADMIN, INVESTIGATOR, ANALYST, REVIEWER, VIEWER' })
  @IsOptional()
  role?: Role;
}
