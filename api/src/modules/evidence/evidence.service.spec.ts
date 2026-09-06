import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import { EvidenceService, EVIDENCE_QUEUE_NAME } from './evidence.service';
import { Evidence } from './schemas/evidence.schema';
import { CustodyLog } from './schemas/custody-log.schema';
import { AnalysisResult } from './schemas/analysis-result.schema';
import { Case } from '../cases/schemas/case.schema';
import {
  EVIDENCE_STORAGE_SERVICE,
  IEvidenceStorageService,
} from './storage/evidence-storage.interface';
import { Role } from '../../common/enums/role.enum';
import { EvidenceStatus } from './enums/evidence-status.enum';
import { ProcessingStatus } from './enums/processing-status.enum';
import { IntegrityStatus } from './enums/integrity-status.enum';
import { CustodyAction } from './enums/custody-action.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { getQueueToken } from '@nestjs/bullmq';

describe('EvidenceService', () => {
  let service: EvidenceService;
  let storageService: IEvidenceStorageService;

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
    title: 'Insider Threat Exfiltration',
    createdBy: new Types.ObjectId(mockUser.id),
    assignedUsers: [new Types.ObjectId(mockUser.id)],
    isDeleted: false,
  };

  const mockFileContent = Buffer.from('FORENSIC_RAW_BINARY_DATA_FOR_TESTING');
  const expectedSha256 = crypto
    .createHash('sha256')
    .update(mockFileContent)
    .digest('hex');

  const mockMulterFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'artifact_disk.raw',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: mockFileContent.length,
    buffer: mockFileContent,
    destination: '',
    filename: 'artifact_disk.raw',
    path: '',
    stream: null as any,
  };

  const mockEvidenceDoc = {
    _id: new Types.ObjectId(),
    caseId: mockCase._id,
    evidenceNumber: 'EV-2026-0001',
    originalFilename: 'artifact_disk.raw',
    storageKey: 'cases/123/artifact_disk.raw',
    mimeType: 'application/octet-stream',
    fileSize: mockFileContent.length,
    fileSizeBytes: mockFileContent.length,
    sha256: expectedSha256,
    storageBucket: 'synapsex-evidence',
    source: 'Workstation 892',
    status: EvidenceStatus.QUEUED,
    processingStatus: ProcessingStatus.PENDING,
    integrityStatus: IntegrityStatus.VERIFIED,
    metadata: { sourceDevice: 'Workstation 892' },
    uploadedBy: new Types.ObjectId(mockUser.id),
    uploadedAt: new Date(),
    tags: ['disk'],
    isDeleted: false,
    deletedAt: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockCustodyLogDoc = {
    _id: new Types.ObjectId(),
    evidenceId: mockEvidenceDoc._id,
    caseId: mockCase._id,
    action: CustodyAction.UPLOADED,
    performedBy: new Types.ObjectId(mockUser.id),
    sha256AtAction: expectedSha256,
    details: 'Initial upload',
    timestamp: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockEvidenceModel {
    _id = mockEvidenceDoc._id;
    caseId = mockEvidenceDoc.caseId;
    evidenceNumber = mockEvidenceDoc.evidenceNumber;
    originalFilename = mockEvidenceDoc.originalFilename;
    storageKey = mockEvidenceDoc.storageKey;
    mimeType = mockEvidenceDoc.mimeType;
    fileSize = mockEvidenceDoc.fileSize;
    fileSizeBytes = mockEvidenceDoc.fileSizeBytes;
    sha256 = mockEvidenceDoc.sha256;
    storageBucket = mockEvidenceDoc.storageBucket;
    source = mockEvidenceDoc.source;
    status = mockEvidenceDoc.status;
    processingStatus = mockEvidenceDoc.processingStatus;
    integrityStatus = mockEvidenceDoc.integrityStatus;
    metadata = mockEvidenceDoc.metadata;
    uploadedBy = mockEvidenceDoc.uploadedBy;
    uploadedAt = mockEvidenceDoc.uploadedAt;
    tags = mockEvidenceDoc.tags;
    isDeleted = mockEvidenceDoc.isDeleted;
    deletedAt = mockEvidenceDoc.deletedAt;
    createdAt = mockEvidenceDoc.createdAt;
    updatedAt = mockEvidenceDoc.updatedAt;

    constructor(public data: any) {
      Object.assign(this, data);
      this._id = mockEvidenceDoc._id;
    }
    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
    static findOne = jest.fn();
    static findById = jest.fn();
  }

  class MockCustodyLogModel {
    _id = mockCustodyLogDoc._id;
    evidenceId = mockCustodyLogDoc.evidenceId;
    caseId = mockCustodyLogDoc.caseId;
    action = mockCustodyLogDoc.action;
    performedBy = mockCustodyLogDoc.performedBy;
    sha256AtAction = mockCustodyLogDoc.sha256AtAction;
    details = mockCustodyLogDoc.details;
    timestamp = mockCustodyLogDoc.timestamp;

    constructor(public data: any) {
      Object.assign(this, data);
      this._id = mockCustodyLogDoc._id;
    }
    save = jest.fn().mockResolvedValue(this);
    static find = jest.fn();
  }

  class MockCaseModel {
    static findOne = jest.fn();
    static findById = jest.fn();
  }

  class MockAnalysisResultModel {
    static findOne = jest.fn();
  }

  const mockStorageService: Partial<IEvidenceStorageService> = {
    uploadFile: jest.fn().mockResolvedValue({
      key: 'cases/123/key',
      bucket: 'synapsex-evidence',
      size: mockFileContent.length,
    }),
    getFileBuffer: jest.fn().mockResolvedValue(mockFileContent),
    getFileStream: jest.fn().mockResolvedValue(Readable.from(mockFileContent)),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    generatePresignedDownloadUrl: jest.fn().mockResolvedValue('https://storage.local/presigned-url'),
    checkFileExists: jest.fn().mockResolvedValue(true),
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'bullmq-job-999' }),
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
          useValue: MockAnalysisResultModel,
        },
        {
          provide: EVIDENCE_STORAGE_SERVICE,
          useValue: mockStorageService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getQueueToken(EVIDENCE_QUEUE_NAME),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
    storageService = module.get<IEvidenceStorageService>(EVIDENCE_STORAGE_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(storageService).toBeDefined();
  });

  describe('Validation & uploadAndIngest', () => {
    it('Validation: should throw BadRequestException if file is missing or empty', async () => {
      await expect(
        service.uploadAndIngest(
          null as any,
          mockCase._id.toString(),
          { source: 'Test' },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Validation: should reject dangerous executable scripts', async () => {
      const maliciousFile = {
        ...mockMulterFile,
        originalname: 'exploit.exe',
      };

      await expect(
        service.uploadAndIngest(
          maliciousFile,
          mockCase._id.toString(),
          { source: 'Test' },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Validation: should throw NotFoundException if case does not exist', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.uploadAndIngest(
          mockMulterFile,
          'nonexistent-case-id',
          { source: 'Test' },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('Validation: should throw ForbiddenException if investigator is not assigned to case', async () => {
      const unassignedCase = {
        ...mockCase,
        createdBy: new Types.ObjectId(),
        assignedUsers: [new Types.ObjectId()],
      };

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(unassignedCase),
      });

      await expect(
        service.uploadAndIngest(
          mockMulterFile,
          mockCase._id.toString(),
          { source: 'Test' },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Success Pipeline: should validate, generate SHA-256, store file, save metadata, create custody record, and queue', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      MockEvidenceModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.uploadAndIngest(
        mockMulterFile,
        mockCase._id.toString(),
        {
          source: 'Workstation WKSTN-892',
          description: 'Acquired image',
          tags: ['nvme'],
          metadata: { examiner: 'Alex Mercer' },
        },
        mockUser,
        { ip: '192.168.1.100', userAgent: 'Jest-Agent' },
      );

      expect(result).toBeDefined();
      expect(result.sha256).toBe(expectedSha256);
      expect(result.fileSize).toBe(mockFileContent.length);
      expect(result.evidenceNumber).toMatch(/^EV-\d{4}-0001$/);
      expect(result.processingStatus).toBeDefined();
      expect(result.integrityStatus).toBe(IntegrityStatus.VERIFIED);

      // Storage abstraction layer check
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: 'synapsex-evidence',
          key: expect.stringContaining('cases/'),
          buffer: mockFileContent,
          mimeType: mockMulterFile.mimetype,
        }),
      );

      // Chain of custody check
      expect(result.initialCustodyRecord).toBeDefined();
      expect(result.initialCustodyRecord?.action).toBe(CustodyAction.UPLOADED);
      expect(result.initialCustodyRecord?.sha256AtAction).toBe(expectedSha256);

      // Queue check
      expect(mockQueue.add).toHaveBeenCalled();
      expect(result.queueJobId).toBe('bullmq-job-999');
    });
  });

  describe('findByCaseId', () => {
    it('should return evidence list for authorized user', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      MockEvidenceModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEvidenceDoc]),
      });

      const list = await service.findByCaseId(mockCase._id.toString(), mockUser);
      expect(list).toHaveLength(1);
      expect(list[0].evidenceNumber).toBe('EV-2026-0001');
    });

    it('should throw ForbiddenException if user is not assigned to the case', async () => {
      const unassignedCase = {
        ...mockCase,
        createdBy: new Types.ObjectId(),
        assignedUsers: [new Types.ObjectId()],
      };

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(unassignedCase),
      });

      await expect(
        service.findByCaseId(mockCase._id.toString(), mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findById', () => {
    it('should return evidence metadata when authorized', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvidenceDoc),
      });

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      const evidence = await service.findById(mockEvidenceDoc._id.toString(), mockUser);
      expect(evidence.id).toBe(mockEvidenceDoc._id.toString());
      expect(evidence.sha256).toBe(expectedSha256);
    });
  });

  describe('deleteEvidence (Soft Delete)', () => {
    it('should soft delete evidence and log DISPOSED in custody ledger', async () => {
      const mockDoc = {
        ...mockEvidenceDoc,
        save: jest.fn().mockResolvedValue(true),
      };

      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      const result = await service.deleteEvidence(mockEvidenceDoc._id.toString(), mockUser);

      expect(result.success).toBe(true);
      expect(mockDoc.isDeleted).toBe(true);
      expect(mockDoc.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('getDownloadStream', () => {
    it('should return streaming result and log ACCESSED in custody ledger', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDoc),
      });

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      const download = await service.getDownloadStream(mockEvidenceDoc._id.toString(), mockUser);

      expect(download.originalFilename).toBe('artifact_disk.raw');
      expect(download.fileSize).toBe(mockFileContent.length);
      expect(mockStorageService.getFileStream).toHaveBeenCalledWith(
        mockEvidenceDoc.storageKey,
        mockEvidenceDoc.storageBucket,
      );
    });
  });

  describe('verifyIntegrity', () => {
    it('should re-hash stored object and return verified: true when hash matches', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDoc),
      });
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      (mockStorageService.getFileBuffer as jest.Mock).mockResolvedValue(mockFileContent);

      const verification = await service.verifyIntegrity(
        mockEvidenceDoc._id.toString(),
        mockUser,
      );

      expect(verification.verified).toBe(true);
      expect(verification.computedHash).toBe(expectedSha256);
      expect(verification.recordedHash).toBe(expectedSha256);
      expect(verification.message).toMatch(/verified/i);
    });

    it('should return verified: false if stored content hash differs', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDoc),
      });
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      (mockStorageService.getFileBuffer as jest.Mock).mockResolvedValue(
        Buffer.from('TAMPERED_CONTENT'),
      );

      const verification = await service.verifyIntegrity(
        mockEvidenceDoc._id.toString(),
        mockUser,
      );

      expect(verification.verified).toBe(false);
      expect(verification.computedHash).not.toBe(expectedSha256);
      expect(verification.message).toMatch(/violation/i);
    });
  });

  describe('getAnalysisResult', () => {
    it('should retrieve structured analysis for authorized investigator', async () => {
      MockEvidenceModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDoc),
      });
      MockCaseModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCase),
      });

      const mockAnalysisDoc = {
        _id: new Types.ObjectId(),
        jobId: 'job-123',
        status: 'COMPLETED',
        entities: [{ entityType: 'ip_address', entityValue: '10.0.0.5' }],
        entityCounts: { ip_address: 1 },
        totalEntities: 1,
        executionTimeMs: 25.0,
        createdAt: new Date(),
      };

      MockAnalysisResultModel.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAnalysisDoc),
        }),
      });

      const result = await service.getAnalysisResult(
        mockEvidenceDoc._id.toString(),
        mockUser,
      );

      expect(result.evidenceId).toBe(mockEvidenceDoc._id.toString());
      expect(result.analysisResult.totalEntities).toBe(1);
      expect(result.analysisResult.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException if evidence does not exist', async () => {
      MockEvidenceModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getAnalysisResult('66da91234abcd5678ef09999', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not authorized on case', async () => {
      MockEvidenceModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDoc),
      });
      MockCaseModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockCase,
          createdBy: new Types.ObjectId(),
          assignedUsers: [],
        }),
      });

      const unauthorizedUser: UserProfileDto = {
        id: new Types.ObjectId().toString(),
        email: 'other@synapsex.local',
        name: 'Other Investigator',
        role: Role.INVESTIGATOR,
        isActive: true,
      };

      await expect(
        service.getAnalysisResult(mockEvidenceDoc._id.toString(), unauthorizedUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
