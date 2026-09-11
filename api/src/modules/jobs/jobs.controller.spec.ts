import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  let service: JobsService;

  const mockJobStatus = {
    id: 'job-12345',
    queueName: 'evidence-processing',
    name: 'process-evidence',
    state: 'completed',
    progress: 100,
    attemptsMade: 1,
    maxAttempts: 3,
    failedReason: null,
    timestamp: Date.now(),
    data: { evidenceId: '66da81234abcd5678ef05678' },
  };

  const mockJobsService = {
    getJobStatus: jest.fn().mockResolvedValue(mockJobStatus),
    getEvidenceJobStatus: jest.fn().mockResolvedValue(mockJobStatus),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getJobStatus', () => {
    it('should invoke jobsService.getJobStatus and return execution details', async () => {
      const result = await controller.getJobStatus('evidence-processing', 'job-12345');

      expect(result).toEqual(mockJobStatus);
      expect(mockJobsService.getJobStatus).toHaveBeenCalledWith('evidence-processing', 'job-12345');
    });
  });

  describe('getEvidenceJobStatus', () => {
    it('should invoke jobsService.getEvidenceJobStatus and return job', async () => {
      const result = await controller.getEvidenceJobStatus('66da81234abcd5678ef05678');

      expect(result).toEqual(mockJobStatus);
      expect(mockJobsService.getEvidenceJobStatus).toHaveBeenCalledWith('66da81234abcd5678ef05678');
    });
  });
});
