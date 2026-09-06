import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReviewStatus } from '../enums/review-status.enum';

export class FindingQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Findings per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ReviewStatus,
    description: 'Filter by review lifecycle status (PENDING_REVIEW, APPROVED, REJECTED)',
  })
  @IsEnum(ReviewStatus)
  @IsOptional()
  reviewStatus?: ReviewStatus;

  @ApiPropertyOptional({
    example: 'EXFILTRATION',
    description: 'Filter by finding classification type',
  })
  @IsString()
  @IsOptional()
  findingType?: string;

  @ApiPropertyOptional({
    example: 0.8,
    minimum: 0,
    maximum: 1,
    description: 'Filter by minimum confidence score',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  minConfidence?: number;

  @ApiPropertyOptional({
    enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'],
    description: 'Filter by evidence strength rating',
  })
  @IsString()
  @IsOptional()
  evidenceStrength?: string;

  @ApiPropertyOptional({
    example: 'exfiltration',
    description: 'Search matching title, description, or reasoning',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'confidenceScore', 'findingType', 'reviewStatus'],
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
