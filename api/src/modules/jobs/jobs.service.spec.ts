import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import {
  QUEUE_EVIDENCE_PROCESSING,
  QUEUE_AI_ANALYSIS,
  QUEUE_REPORT_GENERATION,
  DEFAULT_JOB_RETRY_LIMIT,
  DEFAULT_BACKOFF_DELAY_MS,
} from './constants/job-queues.constant';

describe('JobsService', () => {
  let service: JobsService;

  const mockJob = {
    id: 'job-12345',
    name: 'process-evidence',
    data: { evidenceId: '66da81234abcd5678ef05678', caseId: '66da81234abcd5678ef01234' },
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    progress: 100,
    attemptsMade: 1,
    failedReason: null,
    stacktrace: [],
    timestamp: Date.now(),
    processedOn: Date.now(),
    finishedOn: Date.now(),
    getState: jest.fn().mockResolvedValue('completed'),
  };

  const mockEvidenceQueue = {
    add: jest.fn().mockResolvedValue(mockJob),
    getJob: jest.fn().mockResolvedValue(mockJob),
    getJobs: jest.fn().mockResolvedValue([mockJob]),
  };

  const mockAiQueue = {
    add: jest.fn().mockResolvedValue(mockJob),
    getJob: jest.fn().mockResolvedValue(mockJob),
  };

  const mockReportQueue = {
    add: jest.fn().mockResolvedValue(mockJob),
    getJob: jest.fn().mockResolvedValue(mockJob),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
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
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueEvidenceProcessing', () => {
    it('should enqueue job with retry limits (3) and exponential backoff (2000ms)', async () => {
      const payload = {
        evidenceId: '66da81234abcd5678ef05678',
        caseId: '66da81234abcd5678ef01234',
        storageBucket: 'synapsex-evidence',
        storageKey: 'cases/123/ev.raw',
        sha256: 'a'.repeat(64),
        mimeType: 'application/octet-stream',
        fileSize: 1048576,
      };

      const job = await service.enqueueEvidenceProcessing(payload);

      expect(job).toBeDefined();
      expect(mockEvidenceQueue.add).toHaveBeenCalledWith(
        'process-evidence',
        payload,
        expect.objectContaining({
          attempts: DEFAULT_JOB_RETRY_LIMIT,
          backoff: {
            type: 'exponential',
            delay: DEFAULT_BACKOFF_DELAY_MS,
          },
        }),
      );
    });
  });

  describe('enqueueAiAnalysis', () => {
    it('should enqueue job to ai-analysis queue', async () => {
      const payload = {
        evidenceId: '66da81234abcd5678ef05678',
        caseId: '66da81234abcd5678ef01234',
        analysisType: 'deep-triage' as const,
        requestedBy: '66da81234abcd5678ef09999',
      };

      const job = await service.enqueueAiAnalysis(payload);

      expect(job).toBeDefined();
      expect(mockAiQueue.add).toHaveBeenCalledWith('analyze-evidence', payload, expect.any(Object));
    });
  });

  describe('enqueueReportGeneration', () => {
    it('should enqueue job to report-generation queue', async () => {
      const payload = {
        caseId: '66da81234abcd5678ef01234',
        reportType: 'forensic-summary' as const,
        format: 'pdf' as const,
        requestedBy: '66da81234abcd5678ef09999',
      };

      const job = await service.enqueueReportGeneration(payload);

      expect(job).toBeDefined();
      expect(mockReportQueue.add).toHaveBeenCalledWith('generate-report', payload, expect.any(Object));
    });
  });

  describe('getJobStatus', () => {
    it('should return job execution details and state', async () => {
      const status = await service.getJobStatus(QUEUE_EVIDENCE_PROCESSING, 'job-12345');

      expect(status.id).toBe('job-12345');
      expect(status.state).toBe('completed');
      expect(status.maxAttempts).toBe(3);
    });

    it('should throw NotFoundException if job does not exist in queue', async () => {
      mockEvidenceQueue.getJob.mockResolvedValueOnce(null);

      await expect(
        service.getJobStatus(QUEUE_EVIDENCE_PROCESSING, 'missing-job'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEvidenceJobStatus', () => {
    it('should find job matching evidenceId', async () => {
      const status = await service.getEvidenceJobStatus('66da81234abcd5678ef05678');

      expect(status).toBeDefined();
      expect(status?.id).toBe('job-12345');
      expect(status?.data.evidenceId).toBe('66da81234abcd5678ef05678');
    });

    it('should return null if no matching job exists', async () => {
      mockEvidenceQueue.getJobs.mockResolvedValueOnce([]);

      const status = await service.getEvidenceJobStatus('nonexistent-evidence');
      expect(status).toBeNull();
    });
  });
});
