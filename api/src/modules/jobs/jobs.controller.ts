import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JobsService, JobStatusResponse } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Jobs & Asynchronous Queues')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1', path: 'jobs' })
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':queueName/:jobId')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track status and retry progress of a background BullMQ job',
    description:
      'Queries active, waiting, completed, or failed state, retry attempts made, exponential backoff status, and failure reason.',
  })
  @ApiParam({ name: 'queueName', example: 'evidence-processing', description: 'Name of the target BullMQ queue' })
  @ApiParam({ name: 'jobId', example: 'evidence-66da8123-1772761500000', description: 'Job identifier' })
  @ApiResponse({
    status: 200,
    description: 'Job execution status details',
  })
  @ApiResponse({ status: 404, description: 'Job not found in specified queue' })
  async getJobStatus(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<JobStatusResponse> {
    return this.jobsService.getJobStatus(queueName, jobId);
  }

  @Get('evidence/:evidenceId')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve background processing job details for an evidence artifact',
    description: 'Finds the latest background job associated with the specified evidence item.',
  })
  @ApiParam({ name: 'evidenceId', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Evidence processing job status',
  })
  @ApiResponse({ status: 404, description: 'No processing job found for this evidence' })
  async getEvidenceJobStatus(
    @Param('evidenceId') evidenceId: string,
  ): Promise<JobStatusResponse> {
    const job = await this.jobsService.getEvidenceJobStatus(evidenceId);
    if (!job) {
      throw new NotFoundException(`No background processing job found for evidence '${evidenceId}'`);
    }
    return job;
  }
}
