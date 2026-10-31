import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { Role } from '../../common/enums/role.enum';
import { EvidenceStatus } from './enums/evidence-status.enum';
import { ProcessingStatus } from './enums/processing-status.enum';
import { IntegrityStatus } from './enums/integrity-status.enum';
import { CustodyAction } from './enums/custody-action.enum';

describe('EvidenceController', () => {
  let controller: EvidenceController;
  let evidenceService: EvidenceService;

  const mockUser = {
    id: '66da81234abcd5678ef01234',
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockEvidence = {
    id: '66da91234abcd5678ef05678',
    caseId: '66da81234abcd5678ef01111',
    evidenceNumber: 'EV-2026-0001',
    originalFilename: 'memory_dump.raw',
    storageKey: 'cases/66da81234abcd5678ef01111/ev-uuid-memory_dump.raw',
    mimeType: 'application/octet-stream',
    fileSize: 1048576,
    fileSizeBytes: 1048576,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    md5: 'd41d8cd98f00b204e9800998ecf8427e',
    storageBucket: 'synapsex-evidence',
    source: 'Target Workstation RAM',
    description: 'Volatile memory dump',
    tags: ['ram', 'volatile'],
    status: EvidenceStatus.QUEUED,
    processingStatus: ProcessingStatus.PENDING,
    integrityStatus: IntegrityStatus.VERIFIED,
    metadata: { sourceDevice: 'Workstation 892' },
    uploadedBy: '66da81234abcd5678ef01234',
    uploadedAt: new Date().toISOString(),
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCustodyLog = {
    id: '66da91234abcd5678ef09999',
    evidenceId: '66da91234abcd5678ef05678',
    caseId: '66da81234abcd5678ef01111',
    action: CustodyAction.UPLOADED,
    performedBy: '66da81234abcd5678ef01234',
    sha256AtAction: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    details: 'Evidence file uploaded and cryptographic hash generated',
    ipAddress: '127.0.0.1',
    userAgent: 'Jest-Test-Agent',
    timestamp: new Date().toISOString(),
  };

  const mockVerifyResult = {
    evidenceNumber: 'EV-2026-0001',
    verified: true,
    recordedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    computedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    message: 'Cryptographic SHA-256 integrity verified successfully.',
    custodyLog: mockCustodyLog,
  };

  const mockEvidenceService = {
    uploadAndIngest: jest.fn().mockResolvedValue(mockEvidence),
    findByCaseId: jest.fn().mockResolvedValue([mockEvidence]),
    findById: jest.fn().mockResolvedValue(mockEvidence),
    deleteEvidence: jest.fn().mockResolvedValue({
      success: true,
      message: 'Evidence EV-2026-0001 was successfully removed',
      evidenceId: '66da91234abcd5678ef05678',
    }),
    getDownloadStream: jest.fn().mockResolvedValue({
      stream: Readable.from(Buffer.from('binary-stream-data')),
      originalFilename: 'memory_dump.raw',
      mimeType: 'application/octet-stream',
      fileSize: 1048576,
    }),
    getSecureDownloadUrl: jest.fn().mockResolvedValue({
      downloadUrl: 'https://storage.local/presigned-url',
      expiresInSeconds: 3600,
    }),
    getCustodyChain: jest.fn().mockResolvedValue([mockCustodyLog]),
    verifyIntegrity: jest.fn().mockResolvedValue(mockVerifyResult),
    getAnalysisResult: jest.fn().mockResolvedValue({
      evidenceId: '66da91234abcd5678ef05678',
      caseId: '66da81234abcd5678ef01111',
      fileName: 'memory_dump.raw',
      processingStatus: ProcessingStatus.COMPLETED,
      analysisResult: {
        totalEntities: 2,
        entities: [{ entityType: 'ip_address', entityValue: '192.168.1.1' }],
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvidenceController],
      providers: [
        {
          provide: EvidenceService,
          useValue: mockEvidenceService,
        },
      ],
    }).compile();

    controller = module.get<EvidenceController>(EvidenceController);
    evidenceService = module.get<EvidenceService>(EvidenceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(evidenceService).toBeDefined();
  });

  describe('uploadEvidence', () => {
    it('should invoke evidenceService.uploadAndIngest with file and context', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'memory_dump.raw',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        buffer: Buffer.from('forensic memory contents'),
        size: 24,
      } as Express.Multer.File;

      const uploadDto = {
        source: 'Target Workstation RAM',
        description: 'Volatile memory dump',
        tags: ['ram', 'volatile'],
      };

      const result = await controller.uploadEvidence(
        '66da81234abcd5678ef01111',
        mockFile,
        uploadDto,
        mockUser,
        '127.0.0.1',
        'Mozilla/5.0 TestBrowser',
      );

      expect(result).toEqual(mockEvidence);
      expect(mockEvidenceService.uploadAndIngest).toHaveBeenCalledWith(
        mockFile,
        '66da81234abcd5678ef01111',
        uploadDto,
        mockUser,
        { ip: '127.0.0.1', userAgent: 'Mozilla/5.0 TestBrowser' },
      );
    });
  });

  describe('getCaseEvidence', () => {
    it('should invoke evidenceService.findByCaseId', async () => {
      const result = await controller.getCaseEvidence('66da81234abcd5678ef01111', mockUser);

      expect(result).toEqual([mockEvidence]);
      expect(mockEvidenceService.findByCaseId).toHaveBeenCalledWith(
        '66da81234abcd5678ef01111',
        mockUser,
      );
    });
  });

  describe('getEvidenceById', () => {
    it('should invoke evidenceService.findById', async () => {
      const result = await controller.getEvidenceById('66da91234abcd5678ef05678', mockUser);

      expect(result).toEqual(mockEvidence);
      expect(mockEvidenceService.findById).toHaveBeenCalledWith(
        '66da91234abcd5678ef05678',
        mockUser,
      );
    });
  });

  describe('deleteEvidence', () => {
    it('should invoke evidenceService.deleteEvidence and return confirmation', async () => {
      const result = await controller.deleteEvidence(
        '66da91234abcd5678ef05678',
        mockUser,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result.success).toBe(true);
      expect(mockEvidenceService.deleteEvidence).toHaveBeenCalledWith(
        '66da91234abcd5678ef05678',
        mockUser,
        { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' },
      );
    });
  });

  describe('downloadEvidence', () => {
    it('should set streaming headers and pipe file stream to response', async () => {
      const mockPipe = jest.fn();
      mockEvidenceService.getDownloadStream.mockResolvedValueOnce({
        stream: { pipe: mockPipe } as any,
        originalFilename: 'memory_dump.raw',
        mimeType: 'application/octet-stream',
        fileSize: 1048576,
      });

      const mockRes: any = {
        set: jest.fn(),
      };

      await controller.downloadEvidence(
        '66da91234abcd5678ef05678',
        mockUser,
        '127.0.0.1',
        'Mozilla/5.0',
        mockRes,
      );

      expect(mockEvidenceService.getDownloadStream).toHaveBeenCalledWith(
        '66da91234abcd5678ef05678',
        mockUser,
        { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' },
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/octet-stream',
          'Content-Length': 1048576,
        }),
      );
      expect(mockPipe).toHaveBeenCalledWith(mockRes);
    });
  });

  describe('getSecureDownloadUrl', () => {
    it('should invoke evidenceService.getSecureDownloadUrl', async () => {
      const result = await controller.getSecureDownloadUrl(
        '66da91234abcd5678ef05678',
        mockUser,
        '127.0.0.1',
      );

      expect(result.downloadUrl).toBe('https://storage.local/presigned-url');
      expect(result.expiresInSeconds).toBe(3600);
    });
  });

  describe('verifyIntegrity', () => {
    it('should invoke evidenceService.verifyIntegrity and return verification report', async () => {
      const result = await controller.verifyIntegrity(
        '66da91234abcd5678ef05678',
        mockUser,
        '10.0.0.1',
        'Forensic-Agent/1.0',
      );

      expect(result).toEqual(mockVerifyResult);
      expect(mockEvidenceService.verifyIntegrity).toHaveBeenCalledWith(
        '66da91234abcd5678ef05678',
        mockUser,
        { ip: '10.0.0.1', userAgent: 'Forensic-Agent/1.0' },
      );
    });
  });

  describe('getAnalysis', () => {
    it('should invoke evidenceService.getAnalysisResult and return structured findings', async () => {
      const result = await controller.getAnalysis(
        '66da91234abcd5678ef05678',
        mockUser,
      );

      expect(result.evidenceId).toBe('66da91234abcd5678ef05678');
      expect(result.processingStatus).toBe(ProcessingStatus.COMPLETED);
      expect(result.analysisResult.totalEntities).toBe(2);
      expect(mockEvidenceService.getAnalysisResult).toHaveBeenCalledWith(
        '66da91234abcd5678ef05678',
        mockUser,
      );
    });
  });
});
