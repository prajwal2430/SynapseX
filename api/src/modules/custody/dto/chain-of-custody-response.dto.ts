import { ApiProperty } from '@nestjs/swagger';
import { CustodyAction } from '../enums/custody-action.enum';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';

export enum ChainVerificationStatus {
  VERIFIED = 'VERIFIED',
  BROKEN_CHAIN = 'BROKEN_CHAIN',
  MISSING_RECORD = 'MISSING_RECORD',
  TAMPERED_RECORD = 'TAMPERED_RECORD',
  EMPTY_CHAIN = 'EMPTY_CHAIN',
}

export class ChainOfCustodyResponseDto {
  @ApiProperty({ example: '66da89994abcd5678ef09999' })
  id: string;

  @ApiProperty({ example: '66da81234abcd5678ef05678' })
  evidenceId: string;

  @ApiProperty({ example: '66da81234abcd5678ef01234' })
  caseId: string;

  @ApiProperty({ enum: CustodyAction, example: CustodyAction.UPLOADED })
  action: CustodyAction;

  @ApiProperty({ type: () => Object, example: '66da81234abcd5678ef01234' })
  actorId: string | UserProfileDto;

  @ApiProperty({ example: '2026-09-06T02:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 1, description: 'Monotonically increasing sequence number' })
  sequenceNumber: number;

  @ApiProperty({
    example: { ip: '192.168.1.100', userAgent: 'Mozilla/5.0 ...' },
    description: 'Contextual forensic metadata recorded at the time of the action',
  })
  metadata: Record<string, any>;

  @ApiProperty({
    example: 'GENESIS',
    description: 'SHA-256 hash of the immediate preceding custody record (or GENESIS for record 1)',
  })
  previousRecordHash: string;

  @ApiProperty({
    example: 'd9b3d0c95d9e5a1b5c9287c807b1a6d40bf420404a011733cfb7b190d62c65bf',
    description: 'Cryptographic SHA-256 hash generated across this record and its previous hash',
  })
  recordHash: string;
}

export class VerifyChainResponseDto {
  @ApiProperty({ example: true, description: 'True if the chain has zero tampering or gaps' })
  isValid: boolean;

  @ApiProperty({
    enum: ChainVerificationStatus,
    example: ChainVerificationStatus.VERIFIED,
    description: 'Tamper-evident verification status',
  })
  status: ChainVerificationStatus;

  @ApiProperty({ example: 4, description: 'Total verified custody blocks in the ledger' })
  totalRecords: number;

  @ApiProperty({
    example: 'd9b3d0c95d9e5a1b5c9287c807b1a6d40bf420404a011733cfb7b190d62c65bf',
    description: 'Current cryptographic head hash of the custody chain',
    nullable: true,
  })
  chainHeadHash: string | null;

  @ApiProperty({ example: '2026-09-06T02:05:00.000Z' })
  verifiedAt: string;

  @ApiProperty({ example: 'Tamper-evident custody verification passed: Chain is unbroken and authentic.' })
  message: string;

  @ApiProperty({
    example: { brokenSequenceIndex: null, anomalyReason: null },
    required: false,
  })
  details?: Record<string, any>;

  @ApiProperty({
    example:
      'Notice: SynapseX tamper-evident custody logging provides cryptographic audit integrity within the platform. It does not constitute legal or court certification.',
  })
  disclaimer: string;
}
