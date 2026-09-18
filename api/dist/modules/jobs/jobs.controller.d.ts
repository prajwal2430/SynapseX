import { JobsService, JobStatusResponse } from './jobs.service';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    getJobStatus(queueName: string, jobId: string): Promise<JobStatusResponse>;
    getEvidenceJobStatus(evidenceId: string): Promise<JobStatusResponse>;
}
