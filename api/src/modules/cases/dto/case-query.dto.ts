import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';

export class CaseQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'exfiltration',
    description: 'Full-text query matching caseNumber, title, or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: CaseStatus,
    description: 'Filter by case lifecycle status',
  })
  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;

  @ApiPropertyOptional({
    enum: CasePriority,
    description: 'Filter by priority level',
  })
  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;

  @ApiPropertyOptional({
    example: 'malware',
    description: 'Filter cases containing a specific tag',
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({
    example: '66da81234abcd5678ef01234',
    description: 'Filter cases assigned to a specific investigator ID',
  })
  @IsMongoId()
  @IsOptional()
  assignedUser?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'priority', 'status', 'caseNumber', 'title'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
