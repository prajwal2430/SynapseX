import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimelineEventResponseDto {
  @ApiProperty({ example: '66da91234abcd5678ef08888', description: 'Timeline Event MongoDB ObjectId' })
  id: string;

  @ApiProperty({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' })
  caseId: string;

  @ApiProperty({ example: '66da91234abcd5678ef05678', description: 'Originating Evidence MongoDB ObjectId' })
  evidenceId: string;

  @ApiProperty({ example: '2026-09-06 01:15:30.450', description: 'Preserved source timestamp string' })
  timestamp: string;

  @ApiProperty({ example: 'UTC', description: 'Preserved timezone identifier or offset' })
  timezone: string;

  @ApiProperty({ example: '2026-09-06T01:15:30.450Z', description: 'Standardized UTC moment' })
  normalizedTimestamp: string;

  @ApiProperty({ example: 'user_logon' })
  eventType: string;

  @ApiProperty({ example: 'User Logon via RDP' })
  title: string;

  @ApiProperty({ example: 'Investigator Alex logged into workstation from 192.168.1.100' })
  description: string;

  @ApiProperty({ example: 'auth.log' })
  source: string;

  @ApiPropertyOptional({
    example: [
      { entityType: 'USER', entityValue: 'alex' },
      { entityType: 'IP_ADDRESS', entityValue: '192.168.1.100' },
    ],
  })
  entities: Array<{
    entityType: string;
    entityValue: string;
    normalizedValue?: string;
    entityId?: string;
  }>;

  @ApiPropertyOptional({ example: { logLine: 42, host: 'WKSTN-892' } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2026-09-06T01:16:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-06T01:16:00.000Z' })
  updatedAt: string;
}
