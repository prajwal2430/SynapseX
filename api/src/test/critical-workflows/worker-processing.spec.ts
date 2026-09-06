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
 * Critical Workflow Test Suite: Flow 8 (Background Job Processing & Pipelines)
 * ============================================================================
 *
 * Validates:
 * 1. Worker consumes BullMQ job with evidence metadata
 * 2. Idempotency: duplicate completed jobs are safely skipped
 * 3. Lifecycle state transitions: QUEUED -> PROCESSING -> COMPLETED
 * 4. Real-time WebSocket event dispatches across pipeline stages (40%, 75%, 90%, 100%)
 * 5. Structured AI analysis results saved to MongoDB
 * 6. Entities extracted and synced to database and Knowledge Graph
 */
describe('Critical Workflow: Background Evidence Processing Pipeline (Flow 8)', () => {
  let worker: EvidenceProcessingDevWorker;

  const mockEvidenceId = new Types.ObjectId().toString();
  const mockCaseId = new Types.ObjectId().toString();

  const mockEvidenceDoc = {
    _id: new Types.ObjectId(mockEvidenceId),
    caseId: new Types.ObjectId(mockCaseId),
    evidenceNumber: 'EVD-2026-0001',
    originalFilename: 'network_capture.pcap',
    mimeType: 'application/vnd.tcpdump.pcap',
    fileSize: 1048576,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
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
    static create = jest.fn();
  }

  const mockAiResponse = {
    fileName: 'network_capture.pcap',
    fileSize: 1048576,
    mimeType: 'application/vnd.tcpdump.pcap',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    totalEntities: 2,
    entityCounts: { IP_ADDRESS: 1, DOMAIN: 1 },
    executionTimeMs: 145,
    entities: [
      {
        entityType: 'IP_ADDRESS',
        entityValue: '198.51.100.42',
        normalizedValue: '198.51.100.42',
        confidence: 0.98,
        context: 'Outbound command-and-control connection detected',
      },
      {
        entityType: 'DOMAIN',
        entityValue: 'c2.malicious-domain.cc',
        normalizedValue: 'c2.malicious-domain.cc',
        confidence: 0.95,
        context: 'DNS query to rogue dynamic domain',
      },
    ],
  };

  const mockAiServiceClient: Partial<IAiServiceClient> = {
    analyzeEvidence: jest.fn().mockResolvedValue(mockAiResponse),
    checkHealth: jest.fn().mockResolvedValue(true),
  };

  const mockEntitiesService = {
    ingestExtractedEntities: jest.fn().mockResolvedValue({ ingested: 2 }),
  };

  const mockGraphService = {
    syncEvidenceEntities: jest.fn().mockResolvedValue({ nodesCreated: 2, edgesCreated: 2 }),
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
      id: 'job-pcap-proc-001',
      data: {
        evidenceId: mockEvidenceId,
        caseId: mockCaseId,
        storageBucket: 'synapsex-evidence',
        storageKey: 'cases/test/network_capture.pcap',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
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

  it('should successfully execute the complete pipeline: status transitions, AI analysis, entity ingestion, graph sync, and event dispatches', async () => {
    MockEvidenceModel.findById.mockResolvedValue(mockEvidenceDoc);

    const job = createMockJob();
    const result = await worker.process(job);

    expect(result.processed).toBe(true);
    expect(result.evidenceId).toBe(mockEvidenceId);

    // 1. Status transition: QUEUED -> PROCESSING -> COMPLETED
    expect(mockEvidenceDoc.processingStatus).toBe(ProcessingStatus.COMPLETED);
    expect(mockEvidenceDoc.save).toHaveBeenCalled();

    // 2. Realtime events emitted at each milestone
    expect(mockRealtimeEventsService.emitEvidenceProcessing).toHaveBeenCalledWith(
      mockCaseId,
      expect.objectContaining({
        evidenceId: mockEvidenceId,
        status: ProcessingStatus.PROCESSING,
      }),
    );
    expect(mockRealtimeEventsService.emitAnalysisStarted).toHaveBeenCalled();
    expect(mockRealtimeEventsService.emitEvidenceProgress).toHaveBeenCalledWith(
      mockCaseId,
      expect.objectContaining({ progress: 40, stage: 'AI_ANALYSIS_COMPLETED' }),
    );
    expect(mockRealtimeEventsService.emitEvidenceProgress).toHaveBeenCalledWith(
      mockCaseId,
      expect.objectContaining({ progress: 75, stage: 'ENTITIES_INGESTED' }),
    );
    expect(mockRealtimeEventsService.emitEvidenceProgress).toHaveBeenCalledWith(
      mockCaseId,
      expect.objectContaining({ progress: 90, stage: 'GRAPH_SYNCHRONIZED' }),
    );
    expect(mockRealtimeEventsService.emitEvidenceCompleted).toHaveBeenCalledWith(
      mockCaseId,
      expect.objectContaining({
        evidenceId: mockEvidenceId,
        status: ProcessingStatus.COMPLETED,
        sha256: mockEvidenceDoc.sha256,
      }),
    );

    // 3. Database persistence of entities and Neo4j graph synchronization
    expect(mockEntitiesService.ingestExtractedEntities).toHaveBeenCalledWith(
      mockCaseId,
      mockEvidenceId,
      mockEvidenceDoc.originalFilename,
      expect.arrayContaining([
        expect.objectContaining({ entityType: 'IP_ADDRESS', entityValue: '198.51.100.42' }),
        expect.objectContaining({ entityType: 'DOMAIN', entityValue: 'c2.malicious-domain.cc' }),
      ]),
    );

    expect(mockGraphService.syncEvidenceEntities).toHaveBeenCalledWith(
      mockCaseId,
      mockEvidenceId,
      mockEvidenceDoc.originalFilename,
      expect.any(Array),
    );
  });

  it('should enforce idempotency and skip duplicate processing if evidence is already COMPLETED', async () => {
    const completedEvidence = {
      ...mockEvidenceDoc,
      processingStatus: ProcessingStatus.COMPLETED,
    };
    MockEvidenceModel.findById.mockResolvedValue(completedEvidence);

    const existingAnalysisId = new Types.ObjectId();
    MockAnalysisResultModel.findOne.mockResolvedValue({
      _id: existingAnalysisId,
      status: 'COMPLETED',
    });

    const job = createMockJob();
    const result = await worker.process(job);

    expect(result.processed).toBe(false);
    expect(result.duplicate).toBe(true);
    expect(result.analysisId).toBe(existingAnalysisId.toString());

    // Verify external AI service was NOT invoked again
    expect(mockAiServiceClient.analyzeEvidence).not.toHaveBeenCalled();
    expect(mockEntitiesService.ingestExtractedEntities).not.toHaveBeenCalled();
  });

  it('should throw an error when processing a non-existent evidence ID', async () => {
    MockEvidenceModel.findById.mockResolvedValue(null);

    const job = createMockJob();
    await expect(worker.process(job)).rejects.toThrow(
      `Evidence '${mockEvidenceId}' does not exist`,
    );
  });
});
