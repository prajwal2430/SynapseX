import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustodyService } from '../../modules/custody/custody.service';
import { ChainOfCustody, GENESIS_HASH } from '../../modules/custody/schemas/chain-of-custody.schema';
import { Evidence } from '../../modules/evidence/schemas/evidence.schema';
import { Case } from '../../modules/cases/schemas/case.schema';
import { CustodyAction } from '../../modules/custody/enums/custody-action.enum';
import { ChainVerificationStatus } from '../../modules/custody/dto/chain-of-custody-response.dto';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../../modules/auth/dto/auth-response.dto';
import { computeCustodyRecordHash } from '../../modules/custody/utils/custody-hash.util';

/**
 * ============================================================================
 * Critical Workflow Test Suite: Flow 7 (Chain of Custody Tamper-Evident Ledger)
 * ============================================================================
 *
 * Validates:
 * 1. Cryptographic genesis anchor (sequence #1 previousRecordHash === GENESIS_HASH)
 * 2. Immutable hash chaining (record N+1 previousRecordHash === record N recordHash)
 * 3. Complete chain verification on pristine, untampered ledger (VERIFIED)
 * 4. Tamper detection: modifying metadata, timestamp, or action triggers TAMPERED_RECORD
 * 5. Pointer alteration detection: broken link between records triggers BROKEN_CHAIN
 * 6. Deletion/omission detection: skipped sequence number triggers MISSING_RECORD
 */
describe('Critical Workflow: Chain of Custody Integrity & Tamper Detection (Flow 7)', () => {
  let custodyService: CustodyService;

  const mockInvestigator: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'custody.examiner@synapsex.local',
    name: 'Custody Officer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockCase = {
    _id: new Types.ObjectId(),
    caseNumber: 'CASE-2026-0001',
    title: 'Custody Tamper Verification Test',
    createdBy: new Types.ObjectId(mockInvestigator.id),
    assignedUsers: [new Types.ObjectId(mockInvestigator.id)],
    isDeleted: false,
  };

  const mockEvidence = {
    _id: new Types.ObjectId(),
    caseId: mockCase._id,
    evidenceNumber: 'EVD-2026-0001',
    originalFilename: 'disk_image.raw',
    isDeleted: false,
  };

  class MockEvidenceModel {
    static findOne = jest.fn();
  }

  class MockCaseModel {
    static findOne = jest.fn();
  }

  class MockCustodyModel {
    static find = jest.fn();
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustodyService,
        {
          provide: getModelToken(ChainOfCustody.name),
          useValue: MockCustodyModel,
        },
        {
          provide: getModelToken(Evidence.name),
          useValue: MockEvidenceModel,
        },
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
      ],
    }).compile();

    custodyService = module.get<CustodyService>(CustodyService);
  });

  /**
   * Helper to construct a mathematically valid 3-record chain
   */
  const buildValidChain = () => {
    const time1 = new Date('2026-09-01T10:00:00Z');
    const time2 = new Date('2026-09-01T11:00:00Z');
    const time3 = new Date('2026-09-01T12:00:00Z');

    // Record 1 (Genesis)
    const rec1Payload = {
      evidenceId: mockEvidence._id.toString(),
      caseId: mockCase._id.toString(),
      action: CustodyAction.UPLOADED,
      actorId: mockInvestigator.id,
      timestamp: time1,
      sequenceNumber: 1,
      previousRecordHash: GENESIS_HASH,
      metadata: { sha256: 'initial-sha256-abc' },
    };
    const hash1 = computeCustodyRecordHash(rec1Payload);

    // Record 2 (Viewed/Inspected)
    const rec2Payload = {
      evidenceId: mockEvidence._id.toString(),
      caseId: mockCase._id.toString(),
      action: CustodyAction.VIEWED,
      actorId: mockInvestigator.id,
      timestamp: time2,
      sequenceNumber: 2,
      previousRecordHash: hash1,
      metadata: { destination: 'Forensic Lab B' },
    };
    const hash2 = computeCustodyRecordHash(rec2Payload);

    // Record 3 (Hash Verified)
    const rec3Payload = {
      evidenceId: mockEvidence._id.toString(),
      caseId: mockCase._id.toString(),
      action: CustodyAction.HASH_VERIFIED,
      actorId: mockInvestigator.id,
      timestamp: time3,
      sequenceNumber: 3,
      previousRecordHash: hash2,
      metadata: { verified: true },
    };
    const hash3 = computeCustodyRecordHash(rec3Payload);

    return [
      {
        ...rec1Payload,
        _id: new Types.ObjectId(),
        recordHash: hash1,
      },
      {
        ...rec2Payload,
        _id: new Types.ObjectId(),
        recordHash: hash2,
      },
      {
        ...rec3Payload,
        _id: new Types.ObjectId(),
        recordHash: hash3,
      },
    ];
  };

  const setupMocksForRecords = (records: any[]) => {
    MockEvidenceModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockEvidence),
    });
    MockCaseModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCase),
    });
    MockCustodyModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(records),
      }),
    });
  };

  it('should verify valid 3-step chain and return ChainVerificationStatus.VERIFIED', async () => {
    const validChain = buildValidChain();
    setupMocksForRecords(validChain);

    const result = await custodyService.verifyChain(
      mockEvidence._id.toString(),
      mockInvestigator,
    );

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(ChainVerificationStatus.VERIFIED);
    expect(result.totalRecords).toBe(3);
    expect(result.chainHeadHash).toBe(validChain[2].recordHash);
    expect(result.message).toContain('Tamper-evident custody verification passed');
  });

  it('should detect TAMPERED_RECORD when an adversary modifies notes or metadata in record #2', async () => {
    const chain = buildValidChain();

    // Adversary tampers with record #2 metadata without updating the cryptographic hash
    chain[1].metadata = { destination: 'Unauthorized Threat Actor Dropoff' };
    setupMocksForRecords(chain);

    const result = await custodyService.verifyChain(
      mockEvidence._id.toString(),
      mockInvestigator,
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ChainVerificationStatus.TAMPERED_RECORD);
    expect(result.message).toContain('Tamper detected in record sequence #2');
    expect(result.details?.sequenceNumber).toBe(2);
    expect(result.details?.storedHash).toBe(chain[1].recordHash);
    expect(result.details?.recomputedHash).not.toBe(chain[1].recordHash);
  });

  it('should detect TAMPERED_RECORD when timestamp is altered after the fact', async () => {
    const chain = buildValidChain();

    // Adversary backdates timestamp on record #1
    chain[0].timestamp = new Date('2020-01-01T00:00:00Z');
    setupMocksForRecords(chain);

    const result = await custodyService.verifyChain(
      mockEvidence._id.toString(),
      mockInvestigator,
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ChainVerificationStatus.TAMPERED_RECORD);
    expect(result.message).toContain('Tamper detected in record sequence #1');
  });

  it('should detect BROKEN_CHAIN when previousRecordHash pointer is altered', async () => {
    const chain = buildValidChain();

    // Adversary changes previousRecordHash of record #3 to point to a fictitious hash
    chain[2].previousRecordHash = '0000000000000000000000000000000000000000000000000000000000000000';
    setupMocksForRecords(chain);

    const result = await custodyService.verifyChain(
      mockEvidence._id.toString(),
      mockInvestigator,
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ChainVerificationStatus.BROKEN_CHAIN);
    expect(result.message).toContain('Broken chain pointer at sequence #3');
    expect(result.details?.sequenceNumber).toBe(3);
  });

  it('should detect MISSING_RECORD when an intermediate record is excised/deleted', async () => {
    const chain = buildValidChain();

    // Adversary purges record #2 completely, jumping from #1 to #3
    const corruptedChain = [chain[0], chain[2]];
    setupMocksForRecords(corruptedChain);

    const result = await custodyService.verifyChain(
      mockEvidence._id.toString(),
      mockInvestigator,
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ChainVerificationStatus.MISSING_RECORD);
    expect(result.message).toContain('Missing record in custody chain: sequence jumped from #1 to #3');
    expect(result.details?.precedingSequence).toBe(1);
    expect(result.details?.encounteredSequence).toBe(3);
  });

  it('should detect BROKEN_CHAIN when first record does not link to GENESIS_HASH', async () => {
    const chain = buildValidChain();

    // Adversary sets non-genesis hash on sequence #1
    chain[0].previousRecordHash = 'arbitrary-non-genesis-anchor-hash';
    setupMocksForRecords(chain);

    const result = await custodyService.verifyChain(
      mockEvidence._id.toString(),
      mockInvestigator,
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ChainVerificationStatus.BROKEN_CHAIN);
    expect(result.message).toContain('Genesis record does not reference GENESIS');
  });

  it('should return EMPTY_CHAIN status when no custody records exist for evidence item', async () => {
    setupMocksForRecords([]);

    const result = await custodyService.verifyChain(
      mockEvidence._id.toString(),
      mockInvestigator,
    );

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(ChainVerificationStatus.EMPTY_CHAIN);
    expect(result.totalRecords).toBe(0);
    expect(result.message).toContain('No custody records found');
  });
});
