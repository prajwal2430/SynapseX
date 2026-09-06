import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';

export class UpdateCaseDto {
  @ApiPropertyOptional({
    example: 'Updated Case Title',
    description: 'Updated title of the investigation',
  })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated detailed description of ongoing findings.',
  })
  @IsString({ message: 'Description must be a string' })
  @MinLength(5, { message: 'Description must be at least 5 characters long' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: CaseStatus.IN_PROGRESS,
    enum: CaseStatus,
    description: 'Lifecycle state of the case',
  })
  @IsEnum(CaseStatus, {
    message: 'Status must be one of: OPEN, IN_PROGRESS, UNDER_REVIEW, CLOSED, ARCHIVED',
  })
  @IsOptional()
  status?: CaseStatus;

  @ApiPropertyOptional({
    example: CasePriority.CRITICAL,
    enum: CasePriority,
  })
  @IsEnum(CasePriority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  @IsOptional()
  priority?: CasePriority;

  @ApiPropertyOptional({
    example: ['66da81234abcd5678ef01234'],
    description: 'Updated list of assigned user IDs',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true, message: 'Each assigned user ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  assignedUsers?: string[];

  @ApiPropertyOptional({
    example: ['apt29', 'ransomware'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
