import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TimelineQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200, description: 'Events per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Filter events occurring on or after this ISO 8601 timestamp',
  })
  @IsDateString({}, { message: 'startDate must be a valid ISO 8601 date string' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-09-30T23:59:59.999Z',
    description: 'Filter events occurring on or before this ISO 8601 timestamp',
  })
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'user_logon',
    description: 'Filter by event category or type',
  })
  @IsString()
  @IsOptional()
  eventType?: string;

  @ApiPropertyOptional({
    example: '66da91234abcd5678ef05678',
    description: 'Filter events discovered within a specific evidence artifact',
  })
  @IsMongoId()
  @IsOptional()
  evidenceId?: string;

  @ApiPropertyOptional({
    example: 'auth.log',
    description: 'Filter events by source file or channel',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'workstation',
    description: 'Search matching title or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'normalizedTimestamp',
    enum: ['normalizedTimestamp', 'createdAt', 'eventType', 'source', 'title'],
    default: 'normalizedTimestamp',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'normalizedTimestamp';

  @ApiPropertyOptional({
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
    description: 'Sort direction (asc for chronological order)',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
