import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Page limit' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter logs by specific user MongoDB ObjectId',
    example: '66da81234abcd5678ef01234',
  })
  @IsOptional()
  @IsString({ message: 'userId must be a string' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter logs by action name',
    example: 'USER_LOGGED_IN',
  })
  @IsOptional()
  @IsString({ message: 'action must be a string' })
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter logs by target resource type',
    example: 'Case',
  })
  @IsOptional()
  @IsString({ message: 'resourceType must be a string' })
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Filter logs by target resource ID',
    example: '66da81234abcd5678ef05678',
  })
  @IsOptional()
  @IsString({ message: 'resourceId must be a string' })
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Start timestamp for date range filtering (ISO 8601 string)',
    example: '2026-09-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO 8601 date string' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End timestamp for date range filtering (ISO 8601 string)',
    example: '2026-09-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  endDate?: string;
}
