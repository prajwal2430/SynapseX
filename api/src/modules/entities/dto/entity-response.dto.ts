import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityType } from '../enums/entity-type.enum';

export class EntityResponseDto {
  @ApiProperty({ example: '66da91234abcd5678ef07777', description: 'Unique Entity MongoDB ObjectId' })
  id: string;

  @ApiProperty({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' })
  caseId: string;

  @ApiProperty({ example: '66da91234abcd5678ef05678', description: 'Originating Evidence MongoDB ObjectId' })
  evidenceId: string;

  @ApiProperty({ enum: EntityType, example: EntityType.IP_ADDRESS })
  type: EntityType;

  @ApiProperty({ example: '192.168.1.105:8080' })
  value: string;

  @ApiProperty({ example: '192.168.1.105' })
  normalizedValue: string;

  @ApiProperty({ example: 0.95, minimum: 0, maximum: 1 })
  confidence: number;

  @ApiProperty({ example: 'network_triage.log' })
  source: string;

  @ApiProperty({ example: 'REGEX_DETERMINISTIC' })
  extractionMethod: string;

  @ApiProperty({ example: 'MEDIUM' })
  evidenceStrength: string;

  @ApiPropertyOptional({ example: { context: 'Connection established to remote host' } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2026-09-06T01:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-06T01:30:00.000Z' })
  updatedAt: string;
}
