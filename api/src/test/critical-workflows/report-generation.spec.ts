import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobsService } from '../../modules/jobs/jobs.service';
import {
  QUEUE_EVIDENCE_PROCESSING,
  QUEUE_AI_ANALYSIS,
  QUEUE_REPORT_GENERATION,
  DEFAULT_JOB_OPTIONS,
  ReportGenerationJobPayload,
} from '../../modules/jobs/constants/job-queues.constant';
import { RealtimeEventsService } from '../../modules/realtime/services/realtime-events.service';
import { EventsGateway } from '../../modules/realtime/gateways/events.gateway';
import { REALTIME_EVENTS, getCaseRoom } from '../../modules/realtime/constants/realtime.constants';

describe('Critical Flow 11: Report Generation Workflow & Dispatch', () => {
  let jobsService: JobsService;
  let realtimeEventsService: RealtimeEventsService;
  let mockReportQueue: any;
  let mockEvidenceQueue: any;
  let mockAiQueue: any;
  let mockEventsGateway: any;
  let mockServer: any;

  const sampleCaseId = '660000000000000000000001';
  const sampleUserId = '660000000000000000000099';

  const mockJobInstance = {
    id: 'report-test-id-123',
    name: 'generate-report',
    data: {},
    opts: { attempts: 3 },
    progress: 100,
    attemptsMade: 1,
    failedReason: null,
    stacktrace: [],
    timestamp: Date.now(),
    processedOn: Date.now() - 1000,
    finishedOn: Date.now(),
    getState: jest.fn().mockResolvedValue('completed'),
  };

  beforeEach(async () => {
    mockReportQueue = {
      add: jest.fn().mockImplementation(async (name, data, opts) => ({
        ...mockJobInstance,
        id: opts.jobId || 'generated-job-id',
        name,
        data,
        opts,
      })),
      getJob: jest.fn().mockImplementation(async (id: string) => {
        if (id === 'missing-job-id') return null;
        return {
          ...mockJobInstance,
          id,
        };
      }),
    };

    mockEvidenceQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
      getJobs: jest.fn().mockResolvedValue([]),
    };

    mockAiQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    };

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockEventsGateway = {
      server: mockServer,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        RealtimeEventsService,
        {
          provide: getQueueToken(QUEUE_EVIDENCE_PROCESSING),
          useValue: mockEvidenceQueue,
        },
        {
          provide: getQueueToken(QUEUE_AI_ANALYSIS),
          useValue: mockAiQueue,
        },
        {
          provide: getQueueToken(QUEUE_REPORT_GENERATION),
          useValue: mockReportQueue,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    jobsService = module.get<JobsService>(JobsService);
    realtimeEventsService = module.get<RealtimeEventsService>(RealtimeEventsService);
  });

  describe('Report Enqueueing & Configuration', () => {
    it('should enqueue a forensic-summary report job with default retry and backoff options', async () => {
      const payload: ReportGenerationJobPayload = {
        caseId: sampleCaseId,
        reportType: 'forensic-summary',
        format: 'pdf',
        requestedBy: sampleUserId,
      };

      const job = await jobsService.enqueueReportGeneration(payload);

      expect(mockReportQueue.add).toHaveBeenCalledTimes(1);
      const [jobName, jobData, jobOptions] = mockReportQueue.add.mock.calls[0];

      expect(jobName).toBe('generate-report');
      expect(jobData).toEqual(payload);
      expect(jobOptions.attempts).toBe(3);
      expect(jobOptions.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
      expect(jobOptions.removeOnComplete).toEqual({
        age: 86400,
        count: 500,
      });
      expect(jobOptions.removeOnFail).toEqual({
        age: 604800,
        count: 1000,
      });
      expect(job.id).toMatch(new RegExp(`^report-${sampleCaseId}-forensic-summary-\\d+$`));
    });

    it('should accept different report types and formats (chain-of-custody HTML, full-case-dossier JSON)', async () => {
      const payloads: ReportGenerationJobPayload[] = [
        {
          caseId: sampleCaseId,
          reportType: 'chain-of-custody',
          format: 'html',
          requestedBy: sampleUserId,
        },
        {
          caseId: sampleCaseId,
          reportType: 'full-case-dossier',
          format: 'json',
          requestedBy: sampleUserId,
        },
      ];

      for (const payload of payloads) {
        const job = await jobsService.enqueueReportGeneration(payload);
        expect(job.id).toMatch(new RegExp(`^report-${sampleCaseId}-${payload.reportType}-\\d+$`));
      }

      expect(mockReportQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should allow overriding default job options with custom options (priority, custom attempts)', async () => {
      const payload: ReportGenerationJobPayload = {
        caseId: sampleCaseId,
        reportType: 'full-case-dossier',
        format: 'pdf',
        requestedBy: sampleUserId,
      };

      const customOptions = {
        priority: 1,
        attempts: 5,
      };

      await jobsService.enqueueReportGeneration(payload, customOptions);

      const [, , appliedOptions] = mockReportQueue.add.mock.calls[0];
      expect(appliedOptions.priority).toBe(1);
      expect(appliedOptions.attempts).toBe(5);
      expect(appliedOptions.backoff).toEqual(DEFAULT_JOB_OPTIONS.backoff);
    });
  });

  describe('Job Status Inspection & Error Boundaries', () => {
    it('should retrieve job status details from report-generation queue', async () => {
      const status = await jobsService.getJobStatus(
        QUEUE_REPORT_GENERATION,
        'report-valid-id-123',
      );

      expect(mockReportQueue.getJob).toHaveBeenCalledWith('report-valid-id-123');
      expect(status.id).toBe('report-valid-id-123');
      expect(status.queueName).toBe(QUEUE_REPORT_GENERATION);
      expect(status.state).toBe('completed');
      expect(status.progress).toBe(100);
      expect(status.maxAttempts).toBe(3);
    });

    it('should throw NotFoundException when report job is not found', async () => {
      await expect(
        jobsService.getJobStatus(QUEUE_REPORT_GENERATION, 'missing-job-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when querying an unknown queue', async () => {
      await expect(
        jobsService.getJobStatus('invalid-queue-name', 'some-job-id'),
      ).rejects.toThrow(new NotFoundException("Unknown job queue 'invalid-queue-name'"));
    });
  });

  describe('Real-Time Notification Dispatch', () => {
    it('should broadcast report:generated event strictly to the isolated case room', () => {
      const reportPayload = {
        reportId: 'rep-999',
        title: 'Forensic Triage Summary',
        format: 'pdf',
        generatedBy: sampleUserId,
      };

      realtimeEventsService.emitReportGenerated(sampleCaseId, reportPayload);

      const expectedRoom = getCaseRoom(sampleCaseId);
      expect(mockServer.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockServer.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.REPORT_GENERATED,
        expect.objectContaining({
          caseId: sampleCaseId,
          reportId: 'rep-999',
          title: 'Forensic Triage Summary',
          format: 'pdf',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should gracefully skip emission when the WebSocket server is not yet initialized', () => {
      mockEventsGateway.server = null;

      expect(() => {
        realtimeEventsService.emitReportGenerated(sampleCaseId, {
          reportId: 'rep-888',
          title: 'Chain of Custody Audit',
          format: 'json',
        });
      }).not.toThrow();

      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });
});
