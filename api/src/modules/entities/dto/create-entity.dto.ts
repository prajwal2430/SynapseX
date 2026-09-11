import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EntityType } from '../enums/entity-type.enum';

export class CreateEntityDto {
  @ApiProperty({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({ example: '66da91234abcd5678ef05678', description: 'Evidence artifact MongoDB ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  evidenceId: string;

  @ApiProperty({ enum: EntityType, example: EntityType.IP_ADDRESS })
  @IsEnum(EntityType)
  @IsNotEmpty()
  type: EntityType;

  @ApiProperty({ example: '192.168.1.105:8080', description: 'Raw observed entity string' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ example: '192.168.1.105', description: 'Optional explicit normalized value' })
  @IsString()
  @IsOptional()
  normalizedValue?: string;

  @ApiPropertyOptional({ example: 0.95, minimum: 0, maximum: 1, default: 1.0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence?: number = 1.0;

  @ApiProperty({ example: 'syslog.log', description: 'Source file or event channel' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiPropertyOptional({ example: 'REGEX_DETERMINISTIC', default: 'AI_ANALYSIS' })
  @IsString()
  @IsOptional()
  extractionMethod?: string = 'AI_ANALYSIS';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'], default: 'MEDIUM' })
  @IsString()
  @IsOptional()
  evidenceStrength?: string = 'MEDIUM';

  @ApiPropertyOptional({ description: 'Arbitrary forensic contextual metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
