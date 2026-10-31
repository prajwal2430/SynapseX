import { ApiProperty } from '@nestjs/swagger';
import { EvidenceStatus } from '../enums/evidence-status.enum';
import { ProcessingStatus } from '../enums/processing-status.enum';
import { IntegrityStatus } from '../enums/integrity-status.enum';
import { CustodyAction } from '../enums/custody-action.enum';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';

export class CustodyLogResponseDto {
  @ApiProperty({ example: '66da89994abcd5678ef09999' })
  id: string;

  @ApiProperty({ example: '66da81234abcd5678ef05678' })
  evidenceId: string;

  @ApiProperty({ example: '66da81234abcd5678ef01234' })
  caseId: string;

  @ApiProperty({ enum: CustodyAction, example: CustodyAction.UPLOADED })
  action: CustodyAction;

  @ApiProperty({ type: () => Object, example: '66da81234abcd5678ef01234' })
  performedBy: string | UserProfileDto;

  @ApiProperty({
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'Cryptographic SHA-256 hash verified at time of this action',
  })
  sha256AtAction: string;

  @ApiProperty({ example: 'Initial evidence upload into secure object storage vault' })
  details: string;

  @ApiProperty({ example: '192.168.1.105', required: false })
  ipAddress?: string;

  @ApiProperty({ example: 'Mozilla/5.0 ...', required: false })
  userAgent?: string;

  @ApiProperty({ example: '2026-09-06T01:45:00.000Z' })
  timestamp: string;
}

export class EvidenceResponseDto {
  @ApiProperty({ example: '66da81234abcd5678ef05678' })
  id: string;

  @ApiProperty({ example: '66da81234abcd5678ef01234' })
  caseId: string;

  @ApiProperty({ example: 'EV-2026-0001' })
  evidenceNumber: string;

  @ApiProperty({ example: 'memory_dump_wkstn892.raw' })
  originalFilename: string;

  @ApiProperty({ example: 'cases/66da81234abcd5678ef01234/1772761500000-a591a6d40bf4-memory.raw' })
  storageKey: string;

  @ApiProperty({ example: 'application/octet-stream' })
  mimeType: string;

  @ApiProperty({ example: 4294967296, description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ example: 4294967296, description: 'Alias for fileSize in bytes' })
  fileSizeBytes: number;

  @ApiProperty({
    example: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    description: 'Cryptographic SHA-256 fingerprint generated upon upload',
  })
  sha256: string;

  @ApiProperty({ type: () => Object, example: '66da81234abcd5678ef01234' })
  uploadedBy: string | UserProfileDto;

  @ApiProperty({ example: '2026-09-06T01:45:00.000Z' })
  uploadedAt: string;

  @ApiProperty({
    enum: ProcessingStatus,
    example: ProcessingStatus.PENDING,
    description: 'Current background/analysis processing status',
  })
  processingStatus: ProcessingStatus;

  @ApiProperty({
    enum: IntegrityStatus,
    example: IntegrityStatus.VERIFIED,
    description: 'Cryptographic integrity check status',
  })
  integrityStatus: IntegrityStatus;

  @ApiProperty({
    example: { source: 'Workstation NVMe', tags: ['triage', 'memory'] },
    description: 'Arbitrary forensic metadata key-value store',
  })
  metadata: Record<string, any>;

  @ApiProperty({ example: 'c3499c2729730a7f807efb8676a92dcb', required: false })
  md5?: string;

  @ApiProperty({ example: 'synapsex-evidence' })
  storageBucket: string;

  @ApiProperty({ example: 'Workstation WKSTN-892 Internal NVMe Dump' })
  source: string;

  @ApiProperty({ example: 'Raw disk image acquired during containment' })
  description: string;

  @ApiProperty({ enum: EvidenceStatus, example: EvidenceStatus.QUEUED })
  status: EvidenceStatus;

  @ApiProperty({ example: ['disk-image', 'nvme'] })
  tags: string[];

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: '2026-09-06T01:45:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-06T01:45:00.000Z' })
  updatedAt: string;

  @ApiProperty({ type: () => CustodyLogResponseDto, required: false })
  initialCustodyRecord?: CustodyLogResponseDto;

  @ApiProperty({ example: 'job-123', required: false })
  queueJobId?: string;
}

export class VerifyHashResponseDto {
  @ApiProperty({ example: 'EV-2026-0001' })
  evidenceNumber: string;

  @ApiProperty({ example: true })
  verified: boolean;

  @ApiProperty({ example: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' })
  recordedHash: string;

  @ApiProperty({ example: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' })
  computedHash: string;

  @ApiProperty({ example: 'Cryptographic integrity intact: computed SHA-256 matches recorded value' })
  message: string;

  @ApiProperty({ type: () => CustodyLogResponseDto })
  custodyLog: CustodyLogResponseDto;
}
