import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { Types } from 'mongoose';
import * as crypto from 'crypto';
import { EvidenceService } from '../../modules/evidence/evidence.service';
import { Evidence } from '../../modules/evidence/schemas/evidence.schema';
import { CustodyLog } from '../../modules/evidence/schemas/custody-log.schema';
import { Case } from '../../modules/cases/schemas/case.schema';
import { AnalysisResult } from '../../modules/evidence/schemas/analysis-result.schema';
import { EVIDENCE_STORAGE_SERVICE } from '../../modules/evidence/storage/evidence-storage.interface';
import { QUEUE_EVIDENCE_PROCESSING } from '../../modules/jobs/constants/job-queues.constant';
import { ProcessingStatus } from '../../modules/evidence/enums/processing-status.enum';
import { IntegrityStatus } from '../../modules/evidence/enums/integrity-status.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../../modules/auth/dto/auth-response.dto';

/**
 * ============================================================================
 * Critical Workflow Test Suite: Flow 5 (Evidence Upload) & Flow 6 (SHA-256 Integrity)
 * ============================================================================
 *
 * Validates:
 * 1. File size limit enforcement (>500MB rejected)
 * 2. Allowed extension and MIME validation
 * 3. Deterministic SHA-256 and MD5 cryptographic fingerprint generation
 * 4. Storage abstraction layer invocation (MinIO/S3 persistence)
 * 5. BullMQ background processing queue dispatch ('evidence.process')
 * 6. Cryptographic integrity verification against stored binary
 * 7. Tamper detection: alerting and flagging COMPROMISED when bytes are modified
 */
describe('Critical Workflow: Evidence Ingestion & Cryptographic Integrity (Flows 5 & 6)', () => {
  let evidenceService: EvidenceService;

  const mockInvestigator: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'investigator.forensics@synapsex.local',
    name: 'Forensics Specialist',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockCase = {
    _id: new Types.ObjectId(),
    caseNumber: 'CASE-2026-0001',
    title: 'Financial Intrusion Case',
    createdBy: new Types.ObjectId(mockInvestigator.id),
    assignedUsers: [new Types.ObjectId(mockInvestigator.id)],
    isDeleted: false,
  };

  const testBinaryContent = Buffer.from(
    'SYNAPSEX_FORENSIC_EVIDENCE_PAYLOAD_TEST_VECTOR_2026_CRITICAL',
    'utf-8',
  );

  const expectedSha256 = crypto
    .createHash('sha256')
    .update(testBinaryContent)
    .digest('hex');

  const expectedMd5 = crypto
    .createHash('md5')
    .update(testBinaryContent)
    .digest('hex');

  class MockEvidenceInstance {
    _id = new Types.ObjectId();
    caseId: Types.ObjectId;
    evidenceNumber = 'EVD-2026-0001';
    originalFilename: string;
    mimeType: string;
    fileSizeBytes: number;
    sha256: string;
    md5: string;
    storageBucket = 'synapsex-evidence';
    storageKey = 'cases/test/key.raw';
    processingStatus = ProcessingStatus.QUEUED;
    integrityStatus = IntegrityStatus.UNVERIFIED;
    isDeleted = false;

    constructor(data: any) {
      Object.assign(this, data);
      this.caseId = data.caseId;
      this.originalFilename = data.originalFilename;
      this.mimeType = data.mimeType;
      this.fileSizeBytes = data.fileSizeBytes;
      this.sha256 = data.sha256;
      this.md5 = data.md5;
    }

    save = jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    });
  }

  class MockCustodyLogInstance {
    _id = new Types.ObjectId();
    constructor(data: any) {
      Object.assign(this, data);
    }
    save = jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    });
  }

  class MockEvidenceModel {
    constructor(data: any) {
      return new MockEvidenceInstance(data);
    }
    static findOne = jest.fn();
    static findById = jest.fn();
    static find = jest.fn();
    static countDocuments = jest.fn();
  }

  class MockCustodyLogModel {
    constructor(data: any) {
      return new MockCustodyLogInstance(data);
    }
    static find = jest.fn();
  }

  class MockCaseModel {
    static findOne = jest.fn();
    static findById = jest.fn();
  }

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue({
      bucket: 'synapsex-evidence',
      key: 'cases/test/unique.raw',
      etag: 'mock-etag',
    }),
    getFileBuffer: jest.fn().mockResolvedValue(testBinaryContent),
    deleteFile: jest.fn().mockResolvedValue(true),
  };

  const mockEvidenceQueue = {
    add: jest.fn().mockResolvedValue({ id: 'bullmq-job-123' }),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'storage.bucketEvidence') return 'synapsex-evidence';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        {
          provide: getModelToken(Evidence.name),
          useValue: MockEvidenceModel,
        },
        {
          provide: getModelToken(CustodyLog.name),
          useValue: MockCustodyLogModel,
        },
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
        {
          provide: getModelToken(AnalysisResult.name),
          useValue: {},
        },
        {
          provide: EVIDENCE_STORAGE_SERVICE,
          useValue: mockStorageService,
        },
        {
          provide: getQueueToken(QUEUE_EVIDENCE_PROCESSING),
          useValue: mockEvidenceQueue,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    evidenceService = module.get<EvidenceService>(EvidenceService);
  });

  // ==========================================================================
  // Flow 5: Evidence Upload & Ingestion Pipeline
  // ==========================================================================
  describe('Flow 5: Evidence Ingestion Pipeline & Storage Persistence', () => {
    const validMulterFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'memory_dump_wkst01.raw',
      encoding: '7bit',
      mimetype: 'application/octet-stream',
      buffer: testBinaryContent,
      size: testBinaryContent.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    it('should successfully ingest evidence, calculate hashes, persist to storage, and queue processing job', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });
      MockEvidenceModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null), // No prior evidence
        }),
      });

      const result = await evidenceService.uploadAndIngest(
        validMulterFile,
        mockCase._id.toString(),
        {
          source: 'Live RAM acquisition',
          description: 'Preserved physical memory from host WKST01',
          tags: ['memory', 'volatility'],
        },
        mockInvestigator,
        { ip: '10.0.4.15', userAgent: 'SynapseX-Agent/1.0' },
      );

      expect(result).toBeDefined();
      expect(result.sha256).toBe(expectedSha256);
      expect(result.md5).toBe(expectedMd5);
      expect(result.processingStatus).toBe(ProcessingStatus.QUEUED);

      // Verify binary written to storage abstraction
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: 'synapsex-evidence',
          buffer: testBinaryContent,
          mimeType: 'application/octet-stream',
        }),
      );

      // Verify BullMQ background job enqueued
      expect(mockEvidenceQueue.add).toHaveBeenCalledWith(
        'evidence.process',
        expect.objectContaining({
          evidenceId: expect.any(String),
          caseId: mockCase._id.toString(),
          storageBucket: 'synapsex-evidence',
          sha256: expectedSha256,
        }),
        expect.any(Object),
      );
    });

    it('should reject file upload when file size exceeds maximum 500MB limit (400 Bad Request)', async () => {
      const oversizedFile: Express.Multer.File = {
        ...validMulterFile,
        size: 501 * 1024 * 1024, // 501 MB
        buffer: Buffer.alloc(10), // lightweight mock buffer
      };

      await expect(
        evidenceService.uploadAndIngest(
          oversizedFile,
          mockCase._id.toString(),
          { source: 'Big Image' },
          mockInvestigator,
        ),
      ).rejects.toThrow(
        new BadRequestException('File size exceeds the maximum permitted upload limit of 500 MB'),
      );

      // Verify no storage or queue calls were made
      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
      expect(mockEvidenceQueue.add).not.toHaveBeenCalled();
    });

    it('should reject file upload when extension is not permitted for forensic analysis', async () => {
      const dangerousFile: Express.Multer.File = {
        ...validMulterFile,
        originalname: 'malicious_script.bat',
        mimetype: 'application/x-bat',
      };

      await expect(
        evidenceService.uploadAndIngest(
          dangerousFile,
          mockCase._id.toString(),
          { source: 'Suspicious script' },
          mockInvestigator,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should reject evidence upload when target case is non-existent (404 NotFound)', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const nonExistentCaseId = new Types.ObjectId().toString();

      await expect(
        evidenceService.uploadAndIngest(
          validMulterFile,
          nonExistentCaseId,
          { source: 'Endpoint acquisition' },
          mockInvestigator,
        ),
      ).rejects.toThrow(
        new NotFoundException(`Case with ID '${nonExistentCaseId}' not found`),
      );
    });
  });

  // ==========================================================================
  // Flow 6: SHA-256 Generation & Tamper Verification
  // ==========================================================================
  describe('Flow 6: Cryptographic SHA-256 Integrity Verification', () => {
    it('should verify integrity when stored binary hash strictly matches recorded hash', async () => {
      const evidenceDoc = new MockEvidenceInstance({
        caseId: mockCase._id,
        originalFilename: 'disk_sample.dd',
        sha256: expectedSha256,
        md5: expectedMd5,
        storageKey: 'cases/test/disk_sample.dd',
        storageBucket: 'synapsex-evidence',
      });

      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(evidenceDoc),
      });
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      // Storage returns pristine unmodified buffer
      mockStorageService.getFileBuffer.mockResolvedValue(testBinaryContent);

      const verification = await evidenceService.verifyIntegrity(
        evidenceDoc._id.toString(),
        mockInvestigator,
        { ip: '192.168.1.100' },
      );

      expect(verification.verified).toBe(true);
      expect(verification.recordedHash).toBe(expectedSha256);
      expect(verification.computedHash).toBe(expectedSha256);
      expect(verification.message).toContain('Cryptographic integrity verified');
      expect(evidenceDoc.integrityStatus).toBe(IntegrityStatus.VERIFIED);
      expect(evidenceDoc.save).toHaveBeenCalled();
    });

    it('should detect bit-rot or malicious tampering and flag integrityStatus as COMPROMISED', async () => {
      const evidenceDoc = new MockEvidenceInstance({
        caseId: mockCase._id,
        originalFilename: 'disk_sample.dd',
        sha256: expectedSha256,
        md5: expectedMd5,
        storageKey: 'cases/test/disk_sample.dd',
        storageBucket: 'synapsex-evidence',
      });

      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(evidenceDoc),
      });
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      // Storage returns corrupted binary where 1 byte is flipped
      const tamperedBinary = Buffer.from(testBinaryContent);
      tamperedBinary[0] = tamperedBinary[0] ^ 0xff; // Invert first byte
      mockStorageService.getFileBuffer.mockResolvedValue(tamperedBinary);

      const tamperedSha256 = crypto
        .createHash('sha256')
        .update(tamperedBinary)
        .digest('hex');

      const verification = await evidenceService.verifyIntegrity(
        evidenceDoc._id.toString(),
        mockInvestigator,
        { ip: '192.168.1.100' },
      );

      expect(verification.verified).toBe(false);
      expect(verification.recordedHash).toBe(expectedSha256);
      expect(verification.computedHash).toBe(tamperedSha256);
      expect(verification.computedHash).not.toBe(expectedSha256);
      expect(verification.message).toContain('Integrity violation detected');
      expect(evidenceDoc.integrityStatus).toBe(IntegrityStatus.COMPROMISED);
      expect(evidenceDoc.save).toHaveBeenCalled();
    });
  });
});
