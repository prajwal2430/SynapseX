import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeEventsService } from './realtime-events.service';
import { EventsGateway } from '../gateways/events.gateway';
import { REALTIME_EVENTS, getCaseRoom } from '../constants/realtime.constants';

describe('RealtimeEventsService', () => {
  let service: RealtimeEventsService;
  let mockGateway: Partial<EventsGateway>;
  let mockServer: any;
  let mockRoomEmitter: any;

  const caseId = '64bf9c0e5a9c2b3d8f1e4a01';
  const expectedRoom = getCaseRoom(caseId);

  beforeEach(async () => {
    mockRoomEmitter = {
      emit: jest.fn(),
    };

    mockServer = {
      to: jest.fn().mockReturnValue(mockRoomEmitter),
    };

    mockGateway = {
      server: mockServer,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeEventsService,
        { provide: EventsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<RealtimeEventsService>(RealtimeEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Evidence Processing Events', () => {
    it('should emit evidence:processing to case room', () => {
      service.emitEvidenceProcessing(caseId, {
        evidenceId: 'ev-1',
        filename: 'capture.pcap',
        status: 'PROCESSING',
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.EVIDENCE_PROCESSING,
        expect.objectContaining({
          caseId,
          evidenceId: 'ev-1',
          filename: 'capture.pcap',
          status: 'PROCESSING',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should emit evidence:progress to case room', () => {
      service.emitEvidenceProgress(caseId, {
        evidenceId: 'ev-1',
        progress: 50,
        stage: 'AI_EXTRACTION',
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.EVIDENCE_PROGRESS,
        expect.objectContaining({
          caseId,
          evidenceId: 'ev-1',
          progress: 50,
          stage: 'AI_EXTRACTION',
        }),
      );
    });

    it('should emit evidence:completed to case room', () => {
      service.emitEvidenceCompleted(caseId, {
        evidenceId: 'ev-1',
        analysisId: 'ana-1',
        status: 'COMPLETED',
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.EVIDENCE_COMPLETED,
        expect.objectContaining({
          caseId,
          evidenceId: 'ev-1',
          analysisId: 'ana-1',
          status: 'COMPLETED',
        }),
      );
    });

    it('should emit evidence:failed to case room', () => {
      service.emitEvidenceFailed(caseId, {
        evidenceId: 'ev-1',
        error: 'Timeout',
        attemptsMade: 3,
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.EVIDENCE_FAILED,
        expect.objectContaining({
          caseId,
          evidenceId: 'ev-1',
          error: 'Timeout',
          attemptsMade: 3,
        }),
      );
    });
  });

  describe('AI Analysis Events', () => {
    it('should emit analysis:started to case room', () => {
      service.emitAnalysisStarted(caseId, {
        evidenceId: 'ev-1',
        service: 'fastapi-ai-service',
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.ANALYSIS_STARTED,
        expect.objectContaining({
          caseId,
          evidenceId: 'ev-1',
          service: 'fastapi-ai-service',
        }),
      );
    });

    it('should emit analysis:completed to case room', () => {
      service.emitAnalysisCompleted(caseId, {
        evidenceId: 'ev-1',
        analysisId: 'ana-1',
        entitiesCount: 15,
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.ANALYSIS_COMPLETED,
        expect.objectContaining({
          caseId,
          evidenceId: 'ev-1',
          analysisId: 'ana-1',
          entitiesCount: 15,
        }),
      );
    });

    it('should emit analysis:failed to case room', () => {
      service.emitAnalysisFailed(caseId, {
        evidenceId: 'ev-1',
        error: 'Service unreachable',
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.ANALYSIS_FAILED,
        expect.objectContaining({
          caseId,
          evidenceId: 'ev-1',
          error: 'Service unreachable',
        }),
      );
    });
  });

  describe('Findings and Reports Events', () => {
    it('should emit finding:created to case room', () => {
      service.emitFindingCreated(caseId, {
        findingId: 'f-1',
        title: 'Malware signature match',
        findingType: 'MALWARE_INDICATOR',
        confidenceScore: 0.92,
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.FINDING_CREATED,
        expect.objectContaining({
          caseId,
          findingId: 'f-1',
          title: 'Malware signature match',
          confidenceScore: 0.92,
        }),
      );
    });

    it('should emit report:generated to case room', () => {
      service.emitReportGenerated(caseId, {
        reportId: 'rep-1',
        title: 'Executive Incident Summary',
        format: 'PDF',
      });

      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockRoomEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.REPORT_GENERATED,
        expect.objectContaining({
          caseId,
          reportId: 'rep-1',
          title: 'Executive Incident Summary',
          format: 'PDF',
        }),
      );
    });
  });

  describe('Resilience without server initialized', () => {
    it('should gracefully skip emission when gateway server is null', () => {
      (mockGateway as any).server = null;

      expect(() => {
        service.emitEvidenceProcessing(caseId, {
          evidenceId: 'ev-1',
          status: 'PROCESSING',
        });
      }).not.toThrow();
    });
  });
});
