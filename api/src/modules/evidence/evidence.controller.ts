import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import {
  EvidenceResponseDto,
  CustodyLogResponseDto,
  VerifyHashResponseDto,
} from './dto/evidence-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Evidence & Chain of Custody')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1' })
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('cases/:caseId/evidence')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload evidence artifact into secure storage abstraction',
    description:
      'Validates file size and MIME type, verifies case ownership, generates SHA-256 digest, stores binary via storage abstraction layer (MinIO/S3), saves metadata, logs custody entry, and queues for processing.',
  })
  @ApiParam({ name: 'caseId', description: 'MongoDB ObjectId of the target case' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'source'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Forensic evidence file (disk image, log, packet capture, document)',
        },
        source: {
          type: 'string',
          example: 'Workstation WKSTN-892 NVMe Image',
        },
        description: {
          type: 'string',
          example: 'Acquired during initial incident response triage.',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['disk-image', 'nvme'],
        },
        metadata: {
          type: 'object',
          example: { examiner: 'Alex Mercer', hardware: 'Dell Precision' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Evidence successfully ingested and stored with SHA-256 fingerprint',
    type: EvidenceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File validation failed (size, extension, or MIME type)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authorized for this case' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async uploadEvidence(
    @Param('caseId') caseId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 500 MB maximum upload limit for single multipart upload
          new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadEvidenceDto,
    @CurrentUser() currentUser: UserProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<EvidenceResponseDto> {
    return this.evidenceService.uploadAndIngest(
      file,
      caseId,
      dto,
      currentUser,
      { ip: ipAddress, userAgent },
    );
  }

  @Get('cases/:caseId/evidence')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @ApiOperation({
    summary: 'List all evidence items associated with a case',
    description: 'Returns all non-deleted forensic artifacts ingested for the given case. Requires case access.',
  })
  @ApiParam({ name: 'caseId', description: 'MongoDB ObjectId of the case' })
  @ApiResponse({
    status: 200,
    description: 'List of evidence artifacts',
    type: [EvidenceResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authorized for this case' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async getCaseEvidence(
    @Param('caseId') caseId: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<EvidenceResponseDto[]> {
    return this.evidenceService.findByCaseId(caseId, currentUser);
  }

  @Get('evidence/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @ApiOperation({
    summary: 'Retrieve metadata for a specific evidence item',
    description: 'Returns evidence metadata including processing status, integrity status, SHA-256, and storage key.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Evidence metadata retrieved successfully',
    type: EvidenceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async getEvidenceById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<EvidenceResponseDto> {
    return this.evidenceService.findById(id, currentUser);
  }

  @Delete('evidence/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete an evidence item and log custody disposition',
    description: 'Soft-deletes the evidence artifact and writes a DISPOSED record to the custody ledger. Only ADMIN or assigned INVESTIGATOR can delete.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Evidence soft-deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Evidence EV-2026-0001 was successfully removed' },
        evidenceId: { type: 'string', example: '66da81234abcd5678ef05678' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User cannot manage this evidence' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async deleteEvidence(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{ success: boolean; message: string; evidenceId: string }> {
    return this.evidenceService.deleteEvidence(id, currentUser, {
      ip: ipAddress,
      userAgent,
    });
  }

  @Get('evidence/:id/download')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @ApiOperation({
    summary: 'Securely download evidence file directly through authenticated backend stream',
    description:
      'Requires authentication and case access. Streams binary directly from storage layer without exposing public storage URLs. Logs custody action ACCESSED.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Binary evidence stream',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authorized for this case' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async downloadEvidence(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const fileResult = await this.evidenceService.getDownloadStream(id, currentUser, {
      ip: ipAddress,
      userAgent,
    });

    const safeFilename = encodeURIComponent(fileResult.originalFilename);

    res.set({
      'Content-Type': fileResult.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
      'Content-Length': fileResult.fileSize,
      'X-Content-Type-Options': 'nosniff',
    });

    fileResult.stream.pipe(res);
  }

  @Get('evidence/:id/download-url')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @ApiOperation({
    summary: 'Generate a short-lived secure presigned download URL',
    description: 'Creates a time-limited presigned URL after verifying case authorization. URL expires in 1 hour.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Presigned download URL',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string' },
        expiresInSeconds: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async getSecureDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
    return this.evidenceService.getSecureDownloadUrl(id, currentUser, 3600, {
      ip: ipAddress,
      userAgent,
    });
  }

  @Post('evidence/:id/verify')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify cryptographic SHA-256 integrity against vault storage',
    description:
      'Fetches stored binary from storage layer, recomputes SHA-256 digest, compares with original hash, updates integrity status, and logs a HASH_VERIFIED record in the custody ledger.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Integrity verification result and audit record',
    type: VerifyHashResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async verifyIntegrity(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<VerifyHashResponseDto> {
    return this.evidenceService.verifyIntegrity(id, currentUser, {
      ip: ipAddress,
      userAgent,
    });
  }

  @Get('evidence/:id/analysis')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @ApiOperation({
    summary: 'Retrieve structured AI forensic analysis for evidence artifact',
    description:
      'Fetches structured analysis results stored in MongoDB produced by the internal AI processing pipeline without direct frontend exposure.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Structured analysis results retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async getAnalysis(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<any> {
    return this.evidenceService.getAnalysisResult(id, currentUser);
  }
}
