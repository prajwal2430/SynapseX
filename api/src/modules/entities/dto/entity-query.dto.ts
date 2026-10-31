import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EntityType } from '../enums/entity-type.enum';

export class EntityQueryDto {
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
    example: '192.168.',
    description: 'Full-text or substring query matching raw value or normalized value',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: EntityType,
    description: 'Filter by entity type (e.g. IP_ADDRESS, EMAIL, etc.)',
  })
  @IsEnum(EntityType)
  @IsOptional()
  type?: EntityType;

  @ApiPropertyOptional({
    example: '66da91234abcd5678ef05678',
    description: 'Filter entities discovered within a specific evidence artifact',
  })
  @IsMongoId()
  @IsOptional()
  evidenceId?: string;

  @ApiPropertyOptional({
    example: 0.8,
    minimum: 0,
    maximum: 1,
    description: 'Filter by minimum extraction confidence score',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  minConfidence?: number;

  @ApiPropertyOptional({
    example: 'auth.log',
    description: 'Filter by source log or file descriptor',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'confidence', 'value', 'type', 'normalizedValue'],
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
