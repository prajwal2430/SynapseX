import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustodyService } from './custody.service';
import { ChainOfCustody, GENESIS_HASH } from './schemas/chain-of-custody.schema';
import { Evidence } from '../evidence/schemas/evidence.schema';
import { Case } from '../cases/schemas/case.schema';
import { CustodyAction } from './enums/custody-action.enum';
import { ChainVerificationStatus } from './dto/chain-of-custody-response.dto';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { computeCustodyRecordHash } from './utils/custody-hash.util';

describe('CustodyService - Tamper-Evident Custody Logging', () => {
  let service: CustodyService;

  const mockUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockCase = {
    _id: new Types.ObjectId(),
    caseNumber: 'CASE-2026-0001',
    title: 'Digital Forensics Investigation',
    createdBy: new Types.ObjectId(mockUser.id),
    assignedUsers: [new Types.ObjectId(mockUser.id)],
    isDeleted: false,
  };

  const mockEvidence = {
    _id: new Types.ObjectId(),
    caseId: mockCase._id,
    evidenceNumber: 'EV-2026-0001',
    originalFilename: 'disk_dump.raw',
    isDeleted: false,
  };

  class MockCustodyModel {
    _id = new Types.ObjectId();
    evidenceId: any;
    caseId: any;
    action: any;
    actorId: any;
    timestamp: any;
    sequenceNumber: any;
    metadata: any;
    previousRecordHash: any;
    recordHash: any;

    constructor(public data: any) {
      Object.assign(this, data);
    }

    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
    static findOne = jest.fn();
  }

  class MockEvidenceModel {
    static findOne = jest.fn();
  }

  class MockCaseModel {
    static findOne = jest.fn();
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

    service = module.get<CustodyService>(CustodyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('appendRecord', () => {
    it('should create a genesis record with sequence 1 and GENESIS previousRecordHash', async () => {
      MockCustodyModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const record = await service.appendRecord({
        evidenceId: mockEvidence._id,
        caseId: mockCase._id,
        action: CustodyAction.CREATED,
        actorId: mockUser.id,
        metadata: { source: 'Imaging station' },
      });

      expect(record.sequenceNumber).toBe(1);
      expect(record.previousRecordHash).toBe(GENESIS_HASH);
      expect(record.recordHash).toBeDefined();
      expect(record.recordHash.length).toBe(64);
    });

    it('should chain sequentially and reference preceding record hash', async () => {
      const genesisHash = 'a'.repeat(64);
      const previousRecord = {
        sequenceNumber: 1,
        recordHash: genesisHash,
      };

      MockCustodyModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(previousRecord),
      });

      const secondRecord = await service.appendRecord({
        evidenceId: mockEvidence._id,
        caseId: mockCase._id,
        action: CustodyAction.UPLOADED,
        actorId: mockUser.id,
        metadata: { sha256: 'b'.repeat(64) },
      });

      expect(secondRecord.sequenceNumber).toBe(2);
      expect(secondRecord.previousRecordHash).toBe(genesisHash);
      expect(secondRecord.recordHash).not.toBe(genesisHash);
    });
  });

  describe('getChainByEvidenceId', () => {
    it('should return chronological custody records for authorized user', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidence),
      });

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      const mockRecords = [
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.CREATED,
          actorId: { name: 'Alex Mercer' },
          timestamp: new Date('2026-09-06T00:00:00.000Z'),
          sequenceNumber: 1,
          previousRecordHash: GENESIS_HASH,
          recordHash: 'hash1',
          metadata: {},
        },
      ];

      MockCustodyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRecords),
      });

      const chain = await service.getChainByEvidenceId(
        mockEvidence._id.toString(),
        mockUser,
      );

      expect(chain).toHaveLength(1);
      expect(chain[0].sequenceNumber).toBe(1);
      expect(chain[0].previousRecordHash).toBe(GENESIS_HASH);
    });

    it('should throw ForbiddenException if user is not assigned to the case', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidence),
      });

      const unassignedCase = {
        ...mockCase,
        createdBy: new Types.ObjectId(),
        assignedUsers: [new Types.ObjectId()],
      };

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(unassignedCase),
      });

      await expect(
        service.getChainByEvidenceId(mockEvidence._id.toString(), mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyChain - Cryptographic & Tamper Verification', () => {
    beforeEach(() => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidence),
      });

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });
    });

    it('valid chain: should return isValid = true and status = VERIFIED for intact chain', async () => {
      const t1 = new Date('2026-09-06T01:00:00.000Z');
      const t2 = new Date('2026-09-06T01:10:00.000Z');
      const t3 = new Date('2026-09-06T01:20:00.000Z');

      const hash1 = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.CREATED,
        actorId: mockUser.id,
        timestamp: t1,
        sequenceNumber: 1,
        previousRecordHash: GENESIS_HASH,
        metadata: { examiner: 'Alex' },
      });

      const hash2 = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.UPLOADED,
        actorId: mockUser.id,
        timestamp: t2,
        sequenceNumber: 2,
        previousRecordHash: hash1,
        metadata: { fileSize: 1048576 },
      });

      const hash3 = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.VIEWED,
        actorId: mockUser.id,
        timestamp: t3,
        sequenceNumber: 3,
        previousRecordHash: hash2,
        metadata: {},
      });

      const records = [
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.CREATED,
          actorId: new Types.ObjectId(mockUser.id),
          timestamp: t1,
          sequenceNumber: 1,
          previousRecordHash: GENESIS_HASH,
          recordHash: hash1,
          metadata: { examiner: 'Alex' },
        },
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.UPLOADED,
          actorId: new Types.ObjectId(mockUser.id),
          timestamp: t2,
          sequenceNumber: 2,
          previousRecordHash: hash1,
          recordHash: hash2,
          metadata: { fileSize: 1048576 },
        },
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.VIEWED,
          actorId: new Types.ObjectId(mockUser.id),
          timestamp: t3,
          sequenceNumber: 3,
          previousRecordHash: hash2,
          recordHash: hash3,
          metadata: {},
        },
      ];

      MockCustodyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(records),
      });

      const result = await service.verifyChain(mockEvidence._id.toString(), mockUser);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(ChainVerificationStatus.VERIFIED);
      expect(result.totalRecords).toBe(3);
      expect(result.chainHeadHash).toBe(hash3);
      expect(result.disclaimer).toMatch(/court certification/i);
    });

    it('broken chain: should detect invalid previousRecordHash pointer and return BROKEN_CHAIN', async () => {
      const t1 = new Date('2026-09-06T01:00:00.000Z');
      const t2 = new Date('2026-09-06T01:10:00.000Z');

      const hash1 = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.CREATED,
        actorId: mockUser.id,
        timestamp: t1,
        sequenceNumber: 1,
        previousRecordHash: GENESIS_HASH,
        metadata: {},
      });

      // Record 2 points to an invalid/broken hash
      const brokenPreviousHash = '0'.repeat(64);
      const hash2 = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.UPLOADED,
        actorId: mockUser.id,
        timestamp: t2,
        sequenceNumber: 2,
        previousRecordHash: brokenPreviousHash,
        metadata: {},
      });

      const records = [
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.CREATED,
          actorId: new Types.ObjectId(mockUser.id),
          timestamp: t1,
          sequenceNumber: 1,
          previousRecordHash: GENESIS_HASH,
          recordHash: hash1,
          metadata: {},
        },
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.UPLOADED,
          actorId: new Types.ObjectId(mockUser.id),
          timestamp: t2,
          sequenceNumber: 2,
          previousRecordHash: brokenPreviousHash, // Breaks pointer to hash1
          recordHash: hash2,
          metadata: {},
        },
      ];

      MockCustodyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(records),
      });

      const result = await service.verifyChain(mockEvidence._id.toString(), mockUser);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(ChainVerificationStatus.BROKEN_CHAIN);
      expect(result.message).toMatch(/broken chain pointer/i);
    });

    it('missing record: should detect missing record when sequence numbers are not contiguous', async () => {
      const t1 = new Date('2026-09-06T01:00:00.000Z');
      const t3 = new Date('2026-09-06T01:30:00.000Z');

      const hash1 = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.CREATED,
        actorId: mockUser.id,
        timestamp: t1,
        sequenceNumber: 1,
        previousRecordHash: GENESIS_HASH,
        metadata: {},
      });

      // Record 3 jumps from sequence 1 to sequence 3 (record 2 missing)
      const hash3 = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.DOWNLOADED,
        actorId: mockUser.id,
        timestamp: t3,
        sequenceNumber: 3,
        previousRecordHash: hash1,
        metadata: {},
      });

      const records = [
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.CREATED,
          actorId: new Types.ObjectId(mockUser.id),
          timestamp: t1,
          sequenceNumber: 1,
          previousRecordHash: GENESIS_HASH,
          recordHash: hash1,
          metadata: {},
        },
        {
          _id: new Types.ObjectId(),
          evidenceId: mockEvidence._id,
          caseId: mockCase._id,
          action: CustodyAction.DOWNLOADED,
          actorId: new Types.ObjectId(mockUser.id),
          timestamp: t3,
          sequenceNumber: 3, // GAP: sequence 2 is missing!
          previousRecordHash: hash1,
          recordHash: hash3,
          metadata: {},
        },
      ];

      MockCustodyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(records),
      });

      const result = await service.verifyChain(mockEvidence._id.toString(), mockUser);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(ChainVerificationStatus.MISSING_RECORD);
      expect(result.message).toMatch(/missing record in custody chain/i);
    });

    it('tampered record: should detect when record payload has been modified after hashing', async () => {
      const t1 = new Date('2026-09-06T01:00:00.000Z');

      const originalHash = computeCustodyRecordHash({
        evidenceId: mockEvidence._id.toString(),
        caseId: mockCase._id.toString(),
        action: CustodyAction.CREATED,
        actorId: mockUser.id,
        timestamp: t1,
        sequenceNumber: 1,
        previousRecordHash: GENESIS_HASH,
        metadata: { verified: true },
      });

      // Data modified in database without updating recordHash (or malicious update attempt)
      const tamperedRecord = {
        _id: new Types.ObjectId(),
        evidenceId: mockEvidence._id,
        caseId: mockCase._id,
        action: CustodyAction.DELETED, // Tampered action!
        actorId: new Types.ObjectId(mockUser.id),
        timestamp: t1,
        sequenceNumber: 1,
        previousRecordHash: GENESIS_HASH,
        recordHash: originalHash,
        metadata: { verified: false },
      };

      MockCustodyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([tamperedRecord]),
      });

      const result = await service.verifyChain(mockEvidence._id.toString(), mockUser);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(ChainVerificationStatus.TAMPERED_RECORD);
      expect(result.message).toMatch(/tamper detected/i);
    });
  });
});
