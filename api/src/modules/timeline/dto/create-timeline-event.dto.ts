import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class CreateTimelineEventDto {
  @ApiProperty({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({ example: '66da91234abcd5678ef05678', description: 'Evidence artifact MongoDB ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  evidenceId: string;

  @ApiProperty({ example: '2026-09-06 01:15:30.450', description: 'Original raw timestamp as observed in source evidence' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiPropertyOptional({ example: 'UTC', default: 'UTC', description: 'Source timezone or UTC offset string' })
  @IsString()
  @IsOptional()
  timezone?: string = 'UTC';

  @ApiPropertyOptional({ example: '2026-09-06T01:15:30.450Z', description: 'Optional pre-normalized UTC timestamp string' })
  @IsString()
  @IsOptional()
  normalizedTimestamp?: string;

  @ApiProperty({ example: 'user_logon', description: 'Event classification' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({ example: 'User Logon via RDP', description: 'Short summary title of the forensic event' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Investigator Alex logged into workstation from 192.168.1.100' })
  @IsString()
  @IsOptional()
  description?: string = '';

  @ApiProperty({ example: 'auth.log', description: 'Originating log, capture, or forensic file' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiPropertyOptional({
    example: [
      { entityType: 'USER', entityValue: 'alex' },
      { entityType: 'IP_ADDRESS', entityValue: '192.168.1.100' },
    ],
    description: 'Associated forensic entities mentioned or involved in this event',
  })
  @IsArray()
  @IsOptional()
  entities?: Array<{
    entityType: string;
    entityValue: string;
    normalizedValue?: string;
    entityId?: string;
  }>;

  @ApiPropertyOptional({ description: 'Arbitrary context attributes (e.g. line numbers, offsets, hashes)' })
  @IsOptional()
  metadata?: Record<string, any>;
}
