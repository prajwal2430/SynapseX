import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CasePriority } from '../enums/case-priority.enum';

export class CreateCaseDto {
  @ApiProperty({
    example: 'Insider Threat Data Exfiltration Investigation',
    description: 'Human-readable title of the investigative case',
    minLength: 3,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @ApiProperty({
    example: 'Unauthorized download of proprietary databases observed on endpoint WKSTN-892.',
    description: 'Detailed scope and description of the incident',
    minLength: 5,
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(5, { message: 'Description must be at least 5 characters long' })
  description: string;

  @ApiPropertyOptional({
    example: CasePriority.HIGH,
    enum: CasePriority,
    description: 'Case urgency and severity level (default: MEDIUM)',
  })
  @IsEnum(CasePriority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  @IsOptional()
  priority?: CasePriority = CasePriority.MEDIUM;

  @ApiPropertyOptional({
    example: ['malware', 'insider-threat', 'q3-audit'],
    description: 'Forensic tags associated with the case',
    type: [String],
  })
  @IsArray({ message: 'Tags must be an array of strings' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  tags?: string[] = [];

  @ApiPropertyOptional({
    example: ['66da81234abcd5678ef01234'],
    description: 'Array of MongoDB ObjectIds of assigned investigators',
    type: [String],
  })
  @IsArray({ message: 'Assigned users must be an array of IDs' })
  @IsMongoId({ each: true, message: 'Each assigned user ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  assignedUsers?: string[] = [];
}
