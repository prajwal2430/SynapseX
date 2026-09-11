import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../enums/review-status.enum';

export class FindingResponseDto {
  @ApiProperty({ example: '66da91234abcd5678ef09999', description: 'Finding MongoDB ObjectId' })
  id: string;

  @ApiProperty({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' })
  caseId: string;

  @ApiProperty({ example: 'Suspected Data Exfiltration via Encrypted DNS' })
  title: string;

  @ApiProperty({ example: 'Observed anomalous high-frequency DNS queries containing base64 payloads to suspicious domain.' })
  description: string;

  @ApiProperty({ example: 'EXFILTRATION' })
  findingType: string;

  @ApiProperty({ example: 0.88, minimum: 0, maximum: 1 })
  confidenceScore: number;

  @ApiProperty({ example: 'HIGH' })
  evidenceStrength: string;

  @ApiProperty({ example: ['66da91234abcd5678ef05678'] })
  supportingEvidence: string[];

  @ApiProperty({ example: ['66da91234abcd5678ef07777'] })
  supportingEntities: string[];

  @ApiProperty({ example: 'Chain of evidence indicates 45 rapid DNS TXT queries carrying sequential chunk headers matching compromised workstation.' })
  reasoning: string;

  @ApiProperty({ example: 'Packet capture was truncated; payload decrypted using recovered session key only.' })
  limitations: string;

  @ApiProperty({ example: 'AI_SERVICE' })
  generatedBy: string;

  @ApiProperty({ enum: ReviewStatus, example: ReviewStatus.PENDING_REVIEW })
  reviewStatus: ReviewStatus;

  @ApiPropertyOptional({ example: '66da81234abcd5678ef01234', nullable: true })
  reviewedBy: string | null;

  @ApiPropertyOptional({ example: '2026-09-06T02:00:00.000Z', nullable: true })
  reviewedAt: string | null;

  @ApiPropertyOptional({ example: 'Verified correlation and confirmed exfiltration.' })
  reviewComment: string;

  @ApiProperty({ example: '2026-09-06T01:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-06T02:00:00.000Z' })
  updatedAt: string;
}
