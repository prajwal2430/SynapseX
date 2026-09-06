import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Job } from 'bullmq';
import { EvidenceProcessingDevWorker } from './evidence-processing.dev-worker';
import { Evidence } from '../../evidence/schemas/evidence.schema';
import { AnalysisResult } from '../../evidence/schemas/analysis-result.schema';
import { ProcessingStatus } from '../../evidence/enums/processing-status.enum';
import { AI_SERVICE_CLIENT } from '../../ai-client/interfaces/ai-service-client.interface';
import { EntitiesService } from '../../entities/entities.service';

describe('EvidenceProcessingDevWorker (SynapseX Evidence Worker)', () => {
  let worker: EvidenceProcessingDevWorker;

  const mockEvidenceId = new Types.ObjectId().toString();
  const mockCaseId = new Types.ObjectId().toString();
  const mockEvidenceDoc = {
    _id: new Types.ObjectId(mockEvidenceId),
    caseId: new Types.ObjectId(mockCaseId),
    originalFilename: 'disk_triage.dd',
    mimeType: 'application/octet-stream',
    fileSize: 1048576,
    sha256: 'a'.repeat(64),
    metadata: {},
    processingStatus: ProcessingStatus.QUEUED,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  class MockEvidenceModel {
    static findById = jest.fn();
    static findByIdAndUpdate = jest.fn();
  }

  class MockAnalysisResultModel {
    _id = new Types.ObjectId();
    data: any;
    save = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });

    constructor(data?: any) {
      this.data = data;
    }

    static findOne = jest.fn();
    static create = jest.fn();
  }

  const mockAiServiceClient = {
    analyzeEvidence: jest.fn().mockResolvedValue({
      caseId: mockCaseId,
      evidenceId: mockEvidenceId,
      fileName: 'disk_triage.dd',
      entities: [
        {
          entityType: 'ip_address',
          entityValue: '192.168.1.1',
          normalizedValue: '192.168.1.1',
          confidence: 0.99,
        },
      ],
      entityCounts: { ip_address: 1 },
      totalEntities: 1,
      executionTimeMs: 45.2,
    }),
    checkHealth: jest.fn().mockResolvedValue(true),
  };

  const mockEntitiesService = {
    ingestExtractedEntities: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceProcessingDevWorker,
        {
          provide: getModelToken(Evidence.name),
          useValue: MockEvidenceModel,
        },
        {
          provide: getModelToken(AnalysisResult.name),
          useValue: MockAnalysisResultModel,
        },
        {
          provide: AI_SERVICE_CLIENT,
          useValue: mockAiServiceClient,
        },
        {
          provide: EntitiesService,
          useValue: mockEntitiesService,
        },
      ],
    }).compile();

    worker = module.get<EvidenceProcessingDevWorker>(EvidenceProcessingDevWorker);
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  describe('process (Lifecycle Status Transitions & AI Analysis)', () => {
    it('should transition evidence status from QUEUED to PROCESSING to COMPLETED and invoke AI service', async () => {
      mockEvidenceDoc.processingStatus = ProcessingStatus.QUEUED;
      MockEvidenceModel.findById.mockResolvedValue(mockEvidenceDoc);
      MockAnalysisResultModel.findOne.mockResolvedValue(null);

      const mockJob = {
        id: 'job-999',
        data: {
          evidenceId: mockEvidenceId,
          caseId: mockCaseId,
          sha256: 'a'.repeat(64),
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job<any>;

      const result = await worker.process(mockJob);

      expect(result.processed).toBe(true);
      expect(result.evidenceId).toBe(mockEvidenceId);
      expect(mockEvidenceDoc.processingStatus).toBe(ProcessingStatus.COMPLETED);
      expect(mockEvidenceDoc.save).toHaveBeenCalled();
      expect(mockAiServiceClient.analyzeEvidence).toHaveBeenCalledWith(
        expect.objectContaining({
          evidenceId: mockEvidenceId,
          caseId: mockCaseId,
          fileName: 'disk_triage.dd',
        }),
      );
      expect(mockEntitiesService.ingestExtractedEntities).toHaveBeenCalled();
    });

    it('should prevent duplicate processing if evidence is already COMPLETED with analysis', async () => {
      const completedDoc = {
        ...mockEvidenceDoc,
        processingStatus: ProcessingStatus.COMPLETED,
      };
      MockEvidenceModel.findById.mockResolvedValue(completedDoc);
      MockAnalysisResultModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
        status: 'COMPLETED',
      });

      const mockJob = {
        id: 'job-duplicate-1',
        data: {
          evidenceId: mockEvidenceId,
          caseId: mockCaseId,
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job<any>;

      const result = await worker.process(mockJob);

      expect(result.processed).toBe(false);
      expect(result.duplicate).toBe(true);
      expect(mockAiServiceClient.analyzeEvidence).not.toHaveBeenCalled();
    });

    it('should throw error when simulateFailure is true for retry testing', async () => {
      mockEvidenceDoc.processingStatus = ProcessingStatus.QUEUED;
      MockEvidenceModel.findById.mockResolvedValue(mockEvidenceDoc);
      MockAnalysisResultModel.findOne.mockResolvedValue(null);

      const mockJob = {
        id: 'job-failed-1',
        data: {
          evidenceId: mockEvidenceId,
          caseId: mockCaseId,
          simulateFailure: true,
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job<any>;

      await expect(worker.process(mockJob)).rejects.toThrow(/simulated processing error/i);
      expect(mockEvidenceDoc.processingStatus).toBe(ProcessingStatus.PROCESSING);
    });
  });

  describe('onFailed (Failure Logging & Exhaustion)', () => {
    it('should log warning and NOT mark FAILED when retries remain', async () => {
      const mockJob = {
        id: 'job-retry-1',
        data: { evidenceId: mockEvidenceId, caseId: mockCaseId },
        attemptsMade: 1,
        opts: { attempts: 3 },
      } as unknown as Job<any>;

      await worker.onFailed(mockJob, new Error('Temporary network glitch'));

      expect(MockEvidenceModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should mark evidence as FAILED and record failure AnalysisResult when all retry attempts are exhausted', async () => {
      const mockJob = {
        id: 'job-retry-final',
        data: { evidenceId: mockEvidenceId, caseId: mockCaseId },
        attemptsMade: 3, // Exhausted!
        opts: { attempts: 3 },
      } as unknown as Job<any>;

      await worker.onFailed(mockJob, new Error('Persistent AI service 500 error'));

      expect(MockEvidenceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvidenceId,
        { processingStatus: ProcessingStatus.FAILED },
      );
      expect(MockAnalysisResultModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          evidenceId: mockEvidenceId,
          status: 'FAILED',
          error: 'Persistent AI service 500 error',
        }),
      );
    });
  });
});
