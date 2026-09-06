import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Job } from 'bullmq';
import { EvidenceProcessingDevWorker } from '../../modules/jobs/workers/evidence-processing.dev-worker';
import { Evidence } from '../../modules/evidence/schemas/evidence.schema';
import { AnalysisResult } from '../../modules/evidence/schemas/analysis-result.schema';
import { AI_SERVICE_CLIENT, IAiServiceClient } from '../../modules/ai-client/interfaces/ai-service-client.interface';
import { EntitiesService } from '../../modules/entities/entities.service';
import { GraphService } from '../../modules/graph/graph.service';
import { RealtimeEventsService } from '../../modules/realtime/services/realtime-events.service';
import { ProcessingStatus } from '../../modules/evidence/enums/processing-status.enum';
import { EvidenceProcessingJobPayload } from '../../modules/jobs/constants/job-queues.constant';

/**
 * ============================================================================
 * Critical Workflow Test Suite: Flow 9 (AI Service Failure & Resilience)
 * ============================================================================
 *
 * Validates:
 * 1. Handling Python FastAPI HTTP 500 internal server error
 * 2. Handling network timeouts (ECONNABORTED / 5000ms timeout)
 * 3. Handling offline service / connection refused (ECONNREFUSED)
 * 4. Exhausted retry lifecycle: marking evidence FAILED and saving error diagnostic
 * 5. Non-fatal downstream tolerance: graph/entity sync failure does not fail evidence
 */
describe('Critical Workflow: AI Service Fault Tolerance & Resilience (Flow 9)', () => {
  let worker: EvidenceProcessingDevWorker;

  const mockEvidenceId = new Types.ObjectId().toString();
  const mockCaseId = new Types.ObjectId().toString();

  const mockEvidenceDoc = {
    _id: new Types.ObjectId(mockEvidenceId),
    caseId: new Types.ObjectId(mockCaseId),
    evidenceNumber: 'EVD-2026-0002',
    originalFilename: 'disk_corrupted.raw',
    mimeType: 'application/octet-stream',
    fileSize: 2048,
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    processingStatus: ProcessingStatus.QUEUED,
    metadata: {},
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  class MockEvidenceModel {
    static findById = jest.fn();
    static findByIdAndUpdate = jest.fn();
  }

  class MockAnalysisResultInstance {
    _id = new Types.ObjectId();
    constructor(public data: any) {}
    save = jest.fn().mockResolvedValue(this);
  }

  class MockAnalysisResultModel {
    constructor(data: any) {
      return new MockAnalysisResultInstance(data);
    }
    static findOne = jest.fn();
    static create = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
  }

  const mockAiServiceClient: Partial<IAiServiceClient> = {
    analyzeEvidence: jest.fn(),
    checkHealth: jest.fn(),
  };

  const mockEntitiesService = {
    ingestExtractedEntities: jest.fn(),
  };

  const mockGraphService = {
    syncEvidenceEntities: jest.fn(),
  };

  const mockRealtimeEventsService = {
    emitEvidenceProcessing: jest.fn(),
    emitAnalysisStarted: jest.fn(),
    emitAnalysisCompleted: jest.fn(),
    emitEvidenceProgress: jest.fn(),
    emitEvidenceCompleted: jest.fn(),
    emitEvidenceFailed: jest.fn(),
    emitAnalysisFailed: jest.fn(),
  };

  const createMockJob = (attemptsMade = 0, maxAttempts = 3): Job<EvidenceProcessingJobPayload> => {
    return {
      id: 'job-resilience-001',
      data: {
        evidenceId: mockEvidenceId,
        caseId: mockCaseId,
        storageBucket: 'synapsex-evidence',
        storageKey: 'cases/test/disk_corrupted.raw',
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      },
      opts: { attempts: maxAttempts },
      attemptsMade,
    } as unknown as Job<EvidenceProcessingJobPayload>;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockEvidenceDoc.processingStatus = ProcessingStatus.QUEUED;

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
        {
          provide: GraphService,
          useValue: mockGraphService,
        },
        {
          provide: RealtimeEventsService,
          useValue: mockRealtimeEventsService,
        },
      ],
    }).compile();

    worker = module.get<EvidenceProcessingDevWorker>(EvidenceProcessingDevWorker);
  });

  describe('Transient External Failure Handling (Retries & Error Propagation)', () => {
    it('should propagate error when Python FastAPI AI service returns HTTP 500', async () => {
      MockEvidenceModel.findById.mockResolvedValue(mockEvidenceDoc);

      const http500Error = new Error('HTTP 500 Internal Server Error: AI pipeline crashed');
      (mockAiServiceClient.analyzeEvidence as jest.Mock).mockRejectedValue(http500Error);

      const job = createMockJob(0, 3);

      await expect(worker.process(job)).rejects.toThrow(http500Error);

      // Status was transitioned to PROCESSING before failure
      expect(mockEvidenceDoc.processingStatus).toBe(ProcessingStatus.PROCESSING);
      // Downstream steps should NOT execute
      expect(mockEntitiesService.ingestExtractedEntities).not.toHaveBeenCalled();
      expect(mockGraphService.syncEvidenceEntities).not.toHaveBeenCalled();
    });

    it('should propagate timeout error when AI service times out after 5000ms', async () => {
      MockEvidenceModel.findById.mockResolvedValue(mockEvidenceDoc);

      const timeoutError = new Error('Request timed out after 5000ms');
      (mockAiServiceClient.analyzeEvidence as jest.Mock).mockRejectedValue(timeoutError);

      const job = createMockJob(1, 3); // Attempt 2 of 3

      await expect(worker.process(job)).rejects.toThrow(timeoutError);
    });

    it('should propagate connection error when AI service is offline (ECONNREFUSED)', async () => {
      MockEvidenceModel.findById.mockResolvedValue(mockEvidenceDoc);

      const connRefusedError = new Error('connect ECONNREFUSED 127.0.0.1:8000');
      (mockAiServiceClient.analyzeEvidence as jest.Mock).mockRejectedValue(connRefusedError);

      const job = createMockJob(0, 3);

      await expect(worker.process(job)).rejects.toThrow(connRefusedError);
    });
  });

  describe('Exhausted Retries & Final Failure State (onFailed Lifecycle)', () => {
    it('should NOT mark evidence as FAILED when attempts remain (retry in progress)', async () => {
      const job = createMockJob(1, 3); // Attempt 1 of 3 failed
      const error = new Error('Temporary socket hang up');

      await worker.onFailed(job, error);

      // Emits realtime progress failure event for current attempt
      expect(mockRealtimeEventsService.emitEvidenceFailed).toHaveBeenCalledWith(
        mockCaseId,
        expect.objectContaining({
          evidenceId: mockEvidenceId,
          error: 'Temporary socket hang up',
          attemptsMade: 1,
        }),
      );

      // Should NOT update database to FAILED yet
      expect(MockEvidenceModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(MockAnalysisResultModel.create).not.toHaveBeenCalled();
      expect(mockRealtimeEventsService.emitAnalysisFailed).not.toHaveBeenCalled();
    });

    it('should transition evidence to FAILED and persist failure diagnostic record when all 3 attempts are exhausted', async () => {
      const job = createMockJob(3, 3); // All 3 attempts exhausted
      const fatalError = new Error('Permanent model inference failure');

      await worker.onFailed(job, fatalError);

      // 1. Evidence status marked as FAILED in MongoDB
      expect(MockEvidenceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvidenceId,
        { processingStatus: ProcessingStatus.FAILED },
      );

      // 2. Failure diagnostic record saved in AnalysisResult collection
      expect(MockAnalysisResultModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          caseId: mockCaseId,
          evidenceId: mockEvidenceId,
          status: 'FAILED',
          error: 'Permanent model inference failure',
          totalEntities: 0,
        }),
      );

      // 3. Realtime notifications emitted to case room
      expect(mockRealtimeEventsService.emitEvidenceFailed).toHaveBeenCalledWith(
        mockCaseId,
        expect.objectContaining({
          evidenceId: mockEvidenceId,
          error: 'Permanent model inference failure',
        }),
      );
      expect(mockRealtimeEventsService.emitAnalysisFailed).toHaveBeenCalledWith(
        mockCaseId,
        expect.objectContaining({
          evidenceId: mockEvidenceId,
          error: 'Permanent model inference failure',
        }),
      );
    });
  });

  describe('Non-Fatal Downstream Fault Tolerance', () => {
    it('should complete processing even if Neo4j Knowledge Graph synchronization throws an error', async () => {
      MockEvidenceModel.findById.mockResolvedValue(mockEvidenceDoc);

      (mockAiServiceClient.analyzeEvidence as jest.Mock).mockResolvedValue({
        fileName: 'disk_corrupted.raw',
        fileSize: 2048,
        mimeType: 'application/octet-stream',
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        totalEntities: 1,
        entityCounts: { DEVICE: 1 },
        executionTimeMs: 50,
        entities: [
          {
            entityType: 'DEVICE',
            entityValue: 'USB-SANDISK-32GB',
            normalizedValue: 'usb-sandisk-32gb',
            confidence: 0.99,
          },
        ],
      });

      mockEntitiesService.ingestExtractedEntities.mockResolvedValue({ ingested: 1 });
      // Neo4j temporarily offline or disconnected
      mockGraphService.syncEvidenceEntities.mockRejectedValue(
        new Error('Neo4j Driver Error: Connection pool exhausted'),
      );

      const job = createMockJob(0, 3);
      const result = await worker.process(job);

      // Worker should gracefully catch graph warning and complete successfully
      expect(result.processed).toBe(true);
      expect(mockEvidenceDoc.processingStatus).toBe(ProcessingStatus.COMPLETED);
      expect(mockRealtimeEventsService.emitEvidenceCompleted).toHaveBeenCalled();
    });
  });
});
