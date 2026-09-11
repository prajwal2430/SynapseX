import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import { Evidence, EvidenceDocument } from './schemas/evidence.schema';
import { CustodyLog, CustodyLogDocument } from './schemas/custody-log.schema';
import { AnalysisResult, AnalysisResultDocument } from './schemas/analysis-result.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';
import {
  IEvidenceStorageService,
  EVIDENCE_STORAGE_SERVICE,
} from './storage/evidence-storage.interface';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import {
  EvidenceResponseDto,
  CustodyLogResponseDto,
  VerifyHashResponseDto,
} from './dto/evidence-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { EvidenceStatus } from './enums/evidence-status.enum';
import { ProcessingStatus } from './enums/processing-status.enum';
import { IntegrityStatus } from './enums/integrity-status.enum';
import { CustodyAction } from './enums/custody-action.enum';
import { Role } from '../../common/enums/role.enum';
import { ConfigService } from '@nestjs/config';
import { validateEvidenceFile } from './validators/evidence-file.validator';

export const EVIDENCE_QUEUE_NAME = 'evidence-processing';

export interface EvidenceDownloadStreamResult {
  stream: Readable;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
}

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);
  private readonly bucketName: string;

  constructor(
    @InjectModel(Evidence.name)
    private readonly evidenceModel: Model<EvidenceDocument>,
    @InjectModel(CustodyLog.name)
    private readonly custodyLogModel: Model<CustodyLogDocument>,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
    @Inject(EVIDENCE_STORAGE_SERVICE)
    private readonly storageService: IEvidenceStorageService,
    private readonly configService: ConfigService,
    @Optional()
    @InjectModel(AnalysisResult.name)
    private readonly analysisResultModel?: Model<AnalysisResultDocument>,
    @Optional()
    @InjectQueue(EVIDENCE_QUEUE_NAME)
    private readonly evidenceQueue?: Queue,
  ) {
    this.bucketName = this.configService.get<string>(
      'storage.bucketEvidence',
      'synapsex-evidence',
    );
  }

  /**
   * Evidence Ingestion Pipeline:
   * 1. File Size, MIME Type & Allowed Extension Validation
   * 2. Case Authorization (ADMIN or assigned INVESTIGATOR)
   * 3. SHA-256 & MD5 Generation
   * 4. Unique Storage Key & Cloud/MinIO Object Storage Persistence
   * 5. Metadata Persistence in MongoDB
   * 6. Immutable Chain of Custody Record Creation
   * 7. Asynchronous Task Queueing & Processing Status
   */
  async uploadAndIngest(
    file: Express.Multer.File,
    caseId: string,
    dto: UploadEvidenceDto,
    currentUser: UserProfileDto,
    reqContext?: { ip?: string; userAgent?: string },
  ): Promise<EvidenceResponseDto> {
    // -------------------------------------------------------------------------
    // STEP 1: File size, MIME type & Allowed type validation
    // -------------------------------------------------------------------------
    validateEvidenceFile(file);

    const caseDoc = await this.caseModel
      .findOne({ _id: caseId, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    // Role-based authorization: ADMIN or assigned INVESTIGATOR
    this.assertCanManageCase(caseDoc, currentUser);

    this.logger.log(
      `[Pipeline Step 1] Validated file '${file.originalname}' (${file.size} bytes, ${file.mimetype}) for case '${caseDoc.caseNumber}'`,
    );

    // -------------------------------------------------------------------------
    // STEP 2: Cryptographic SHA-256 and MD5 Generation
    // -------------------------------------------------------------------------
    const sha256 = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const md5 = crypto
      .createHash('md5')
      .update(file.buffer)
      .digest('hex');

    this.logger.log(
      `[Pipeline Step 2] Generated cryptographic fingerprints - SHA-256: ${sha256}, MD5: ${md5}`,
    );

    // -------------------------------------------------------------------------
    // STEP 3: Store File via Storage Abstraction Layer with Unique Key
    // -------------------------------------------------------------------------
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = crypto.randomUUID().substring(0, 8);
    const storageKey = `cases/${caseId}/${Date.now()}-${uniqueId}-${sanitizedFilename}`;

    await this.storageService.uploadFile({
      bucket: this.bucketName,
      key: storageKey,
      buffer: file.buffer,
      mimeType: file.mimetype,
      metadata: {
        'original-filename': file.originalname,
        'sha256': sha256,
        'case-id': caseId,
        'uploaded-by': currentUser.id,
      },
    });

    this.logger.log(
      `[Pipeline Step 3] Securely stored evidence via storage abstraction: ${this.bucketName}/${storageKey}`,
    );

    // -------------------------------------------------------------------------
    // STEP 4: Save Evidence Metadata in MongoDB
    // -------------------------------------------------------------------------
    const evidenceNumber = await this.generateEvidenceNumber();
    const uploadedAt = new Date();

    const mergedMetadata: Record<string, any> = {
      ...(dto.metadata || {}),
      originalExtension: file.originalname.slice(file.originalname.lastIndexOf('.')),
      encoding: file.encoding,
      sourceDevice: dto.source.trim(),
    };

    const newEvidence = new this.evidenceModel({
      caseId: caseDoc._id,
      evidenceNumber,
      originalFilename: file.originalname,
      storageKey,
      mimeType: file.mimetype || 'application/octet-stream',
      fileSize: file.size || file.buffer.length,
      fileSizeBytes: file.size || file.buffer.length,
      sha256,
      md5,
      storageBucket: this.bucketName,
      source: dto.source.trim(),
      description: dto.description?.trim() || '',
      status: EvidenceStatus.QUEUED,
      processingStatus: ProcessingStatus.UPLOADED,
      integrityStatus: IntegrityStatus.VERIFIED,
      metadata: mergedMetadata,
      uploadedBy: new Types.ObjectId(currentUser.id),
      uploadedAt,
      tags: dto.tags || [],
      isDeleted: false,
      deletedAt: null,
    });

    const savedEvidence = await newEvidence.save();

    this.logger.log(
      `[Pipeline Step 4] Saved evidence metadata: ${savedEvidence.evidenceNumber} (ID: ${savedEvidence._id})`,
    );

    // -------------------------------------------------------------------------
    // STEP 5: Create Immutable Chain of Custody Record
    // -------------------------------------------------------------------------
    const initialCustody = new this.custodyLogModel({
      evidenceId: savedEvidence._id,
      caseId: caseDoc._id,
      action: CustodyAction.UPLOADED,
      performedBy: new Types.ObjectId(currentUser.id),
      sha256AtAction: sha256,
      details: `Initial forensic evidence artifact '${file.originalname}' ingested. Cryptographic SHA-256 fingerprint: ${sha256}`,
      ipAddress: reqContext?.ip,
      userAgent: reqContext?.userAgent,
      timestamp: uploadedAt,
    });

    const savedCustody = await initialCustody.save();

    this.logger.log(
      `[Pipeline Step 5] Recorded chain-of-custody entry ID: ${savedCustody._id}`,
    );

    // -------------------------------------------------------------------------
    // STEP 6: Queue Processing via BullMQ
    // -------------------------------------------------------------------------
    let queueJobId: string | undefined;

    if (this.evidenceQueue) {
      try {
        const job = await this.evidenceQueue.add(
          'evidence.process',
          {
            evidenceId: savedEvidence._id.toString(),
            caseId: caseDoc._id.toString(),
            storageBucket: this.bucketName,
            storageKey,
            sha256,
            mimeType: file.mimetype,
            fileSize: savedEvidence.fileSize,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );
        queueJobId = job.id;
        savedEvidence.processingStatus = ProcessingStatus.QUEUED;
        await savedEvidence.save();

        this.logger.log(
          `[Pipeline Step 6] Enqueued BullMQ ingestion job ${job.id} for evidence ${savedEvidence.evidenceNumber}`,
        );
      } catch (err) {
        this.logger.warn(`Could not dispatch BullMQ job: ${err.message}`);
      }
    }

    // -------------------------------------------------------------------------
    // STEP 7: Return Response with Evidence, Custody Record & Processing Status
    // -------------------------------------------------------------------------
    const response = this.mapToEvidenceResponse(savedEvidence);
    response.initialCustodyRecord = this.mapToCustodyResponse(savedCustody);
    response.queueJobId = queueJobId;

    return response;
  }

  /**
   * Retrieves all evidence items for a given case.
   * Validates case authorization (ADMIN or assigned case member).
   */
  async findByCaseId(
    caseId: string,
    currentUser: UserProfileDto,
  ): Promise<EvidenceResponseDto[]> {
    const caseDoc = await this.caseModel
      .findOne({ _id: caseId, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    const evidenceList = await this.evidenceModel
      .find({ caseId, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email role')
      .exec();

    return evidenceList.map((item) => this.mapToEvidenceResponse(item));
  }

  /**
   * Retrieves single evidence details by ID.
   * Validates case authorization.
   */
  async findById(
    id: string,
    currentUser: UserProfileDto,
  ): Promise<EvidenceResponseDto> {
    const evidenceDoc = await this.evidenceModel
      .findOne({ _id: id, isDeleted: false })
      .populate('uploadedBy', 'name email role')
      .exec();

    if (!evidenceDoc) {
      throw new NotFoundException(`Evidence with ID '${id}' not found`);
    }

    const caseDoc = await this.caseModel
      .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
      .exec();

    if (caseDoc) {
      this.assertCanViewCase(caseDoc, currentUser);
    }

    return this.mapToEvidenceResponse(evidenceDoc);
  }

  /**
   * Soft-deletes an evidence artifact.
   * Only ADMIN or the assigned INVESTIGATOR can delete evidence.
   */
  async deleteEvidence(
    id: string,
    currentUser: UserProfileDto,
    reqContext?: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean; message: string; evidenceId: string }> {
    const evidenceDoc = await this.evidenceModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!evidenceDoc) {
      throw new NotFoundException(`Evidence with ID '${id}' not found`);
    }

    const caseDoc = await this.caseModel
      .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Associated case not found`);
    }

    this.assertCanManageCase(caseDoc, currentUser);

    // Soft delete
    evidenceDoc.isDeleted = true;
    evidenceDoc.deletedAt = new Date();
    evidenceDoc.processingStatus = ProcessingStatus.FAILED;
    await evidenceDoc.save();

    // Log custody action DISPOSED
    const custodyRecord = new this.custodyLogModel({
      evidenceId: evidenceDoc._id,
      caseId: evidenceDoc.caseId,
      action: CustodyAction.DISPOSED,
      performedBy: new Types.ObjectId(currentUser.id),
      sha256AtAction: evidenceDoc.sha256,
      details: `Evidence item '${evidenceDoc.evidenceNumber}' soft-deleted and retired from active investigation.`,
      ipAddress: reqContext?.ip,
      userAgent: reqContext?.userAgent,
      timestamp: new Date(),
    });

    await custodyRecord.save();

    this.logger.log(`Evidence '${evidenceDoc.evidenceNumber}' soft-deleted by user '${currentUser.id}'`);

    return {
      success: true,
      message: `Evidence '${evidenceDoc.evidenceNumber}' was successfully removed`,
      evidenceId: id,
    };
  }

  /**
   * Provides authorized secure streaming download of evidence binary.
   * Never exposes direct public storage URLs.
   */
  async getDownloadStream(
    id: string,
    currentUser: UserProfileDto,
    reqContext?: { ip?: string; userAgent?: string },
  ): Promise<EvidenceDownloadStreamResult> {
    const evidenceDoc = await this.evidenceModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!evidenceDoc) {
      throw new NotFoundException(`Evidence with ID '${id}' not found`);
    }

    const caseDoc = await this.caseModel
      .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Associated case not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    const stream = await this.storageService.getFileStream(
      evidenceDoc.storageKey,
      evidenceDoc.storageBucket,
    );

    // Log custody action ACCESSED
    const custodyRecord = new this.custodyLogModel({
      evidenceId: evidenceDoc._id,
      caseId: evidenceDoc.caseId,
      action: CustodyAction.ACCESSED,
      performedBy: new Types.ObjectId(currentUser.id),
      sha256AtAction: evidenceDoc.sha256,
      details: `Authorized evidence binary stream downloaded by examiner.`,
      ipAddress: reqContext?.ip,
      userAgent: reqContext?.userAgent,
      timestamp: new Date(),
    });

    await custodyRecord.save();

    return {
      stream,
      originalFilename: evidenceDoc.originalFilename,
      mimeType: evidenceDoc.mimeType || 'application/octet-stream',
      fileSize: evidenceDoc.fileSize,
    };
  }

  /**
   * Generates a secure, time-limited presigned download URL.
   * Authorization verified before URL issuance.
   */
  async getSecureDownloadUrl(
    id: string,
    currentUser: UserProfileDto,
    expiresInSeconds: number = 3600,
    reqContext?: { ip?: string; userAgent?: string },
  ): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
    const evidenceDoc = await this.evidenceModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!evidenceDoc) {
      throw new NotFoundException(`Evidence with ID '${id}' not found`);
    }

    const caseDoc = await this.caseModel
      .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Associated case not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    const downloadUrl = await this.storageService.generatePresignedDownloadUrl(
      evidenceDoc.storageKey,
      expiresInSeconds,
      evidenceDoc.storageBucket,
    );

    // Log custody action ACCESSED
    const custodyRecord = new this.custodyLogModel({
      evidenceId: evidenceDoc._id,
      caseId: evidenceDoc.caseId,
      action: CustodyAction.ACCESSED,
      performedBy: new Types.ObjectId(currentUser.id),
      sha256AtAction: evidenceDoc.sha256,
      details: `Generated secure, time-limited presigned download link (valid for ${expiresInSeconds}s).`,
      ipAddress: reqContext?.ip,
      userAgent: reqContext?.userAgent,
      timestamp: new Date(),
    });

    await custodyRecord.save();

    return {
      downloadUrl,
      expiresInSeconds,
    };
  }

  /**
   * Retrieves the full immutable chain of custody ledger for an evidence item.
   */
  async getCustodyChain(
    evidenceId: string,
    currentUser: UserProfileDto,
  ): Promise<CustodyLogResponseDto[]> {
    const evidenceDoc = await this.evidenceModel
      .findOne({ _id: evidenceId, isDeleted: false })
      .exec();

    if (!evidenceDoc) {
      throw new NotFoundException(`Evidence with ID '${evidenceId}' not found`);
    }

    const caseDoc = await this.caseModel
      .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
      .exec();

    if (caseDoc) {
      this.assertCanViewCase(caseDoc, currentUser);
    }

    const logs = await this.custodyLogModel
      .find({ evidenceId })
      .sort({ timestamp: -1 })
      .populate('performedBy', 'name email role')
      .exec();

    return logs.map((log) => this.mapToCustodyResponse(log));
  }

  /**
   * Recomputes SHA-256 of the stored binary in object storage and compares with recorded hash.
   */
  async verifyIntegrity(
    evidenceId: string,
    currentUser: UserProfileDto,
    reqContext?: { ip?: string; userAgent?: string },
  ): Promise<VerifyHashResponseDto> {
    const evidenceDoc = await this.evidenceModel
      .findOne({ _id: evidenceId, isDeleted: false })
      .exec();

    if (!evidenceDoc) {
      throw new NotFoundException(`Evidence with ID '${evidenceId}' not found`);
    }

    const caseDoc = await this.caseModel
      .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
      .exec();

    if (caseDoc) {
      this.assertCanViewCase(caseDoc, currentUser);
    }

    // Read stored buffer from object storage
    const buffer = await this.storageService.getFileBuffer(
      evidenceDoc.storageKey,
      evidenceDoc.storageBucket,
    );

    const computedHash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');

    const isVerified = computedHash.toLowerCase() === evidenceDoc.sha256.toLowerCase();

    evidenceDoc.integrityStatus = isVerified
      ? IntegrityStatus.VERIFIED
      : IntegrityStatus.COMPROMISED;
    await evidenceDoc.save();

    // Log the verification in custody trail
    const custodyRecord = new this.custodyLogModel({
      evidenceId: evidenceDoc._id,
      caseId: evidenceDoc.caseId,
      action: CustodyAction.HASH_VERIFIED,
      performedBy: new Types.ObjectId(currentUser.id),
      sha256AtAction: computedHash,
      details: isVerified
        ? `Cryptographic integrity verification PASSED: Stored binary SHA-256 matches recorded value (${computedHash}).`
        : `Cryptographic integrity verification FAILED! Stored binary SHA-256 (${computedHash}) differs from recorded value (${evidenceDoc.sha256}).`,
      ipAddress: reqContext?.ip,
      userAgent: reqContext?.userAgent,
      timestamp: new Date(),
    });

    const savedLog = await custodyRecord.save();

    return {
      evidenceNumber: evidenceDoc.evidenceNumber,
      verified: isVerified,
      recordedHash: evidenceDoc.sha256,
      computedHash,
      message: isVerified
        ? 'Cryptographic integrity verified: Stored object SHA-256 matches original hash.'
        : 'Integrity violation detected: Stored object SHA-256 does not match original hash.',
      custodyLog: this.mapToCustodyResponse(savedLog),
    };
  }

  public assertCanManageCase(
    caseDoc: CaseDocument,
    currentUser: UserProfileDto,
  ): void {
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    if (currentUser.role === Role.INVESTIGATOR) {
      const isCreator = caseDoc.createdBy.toString() === currentUser.id;
      const isAssigned = caseDoc.assignedUsers.some(
        (userId) => userId.toString() === currentUser.id,
      );

      if (isCreator || isAssigned) {
        return;
      }

      throw new ForbiddenException(
        'Access denied: You can only manage evidence for cases assigned to you',
      );
    }

    throw new ForbiddenException(
      'Access denied: You do not have permission to manage evidence for this case',
    );
  }

  public assertCanViewCase(
    caseDoc: CaseDocument,
    currentUser: UserProfileDto,
  ): void {
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    const isCreator = caseDoc.createdBy.toString() === currentUser.id;
    const isAssigned = caseDoc.assignedUsers.some(
      (userId) => userId.toString() === currentUser.id,
    );

    if (isCreator || isAssigned) {
      return;
    }

    throw new ForbiddenException(
      'Access denied: You are not authorized to access evidence for this case',
    );
  }

  private async generateEvidenceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `EV-${currentYear}-`;

    const latestEvidence = await this.evidenceModel
      .findOne({ evidenceNumber: new RegExp(`^${prefix}\\d{4}$`) })
      .sort({ evidenceNumber: -1 })
      .exec();

    let nextNumber = 1;
    if (latestEvidence && latestEvidence.evidenceNumber) {
      const parts = latestEvidence.evidenceNumber.split('-');
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        nextNumber = lastSequence + 1;
      }
    }

    const paddedSequence = String(nextNumber).padStart(4, '0');
    return `${prefix}${paddedSequence}`;
  }

  private mapToEvidenceResponse(doc: any): EvidenceResponseDto {
    return {
      id: doc._id.toString(),
      caseId: doc.caseId?.toString?.() || doc.caseId,
      evidenceNumber: doc.evidenceNumber,
      originalFilename: doc.originalFilename,
      storageKey: doc.storageKey,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize ?? doc.fileSizeBytes ?? 0,
      fileSizeBytes: doc.fileSize ?? doc.fileSizeBytes ?? 0,
      sha256: doc.sha256,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.uploadedAt?.toISOString?.() || doc.createdAt?.toISOString?.() || new Date().toISOString(),
      processingStatus: doc.processingStatus || ProcessingStatus.PENDING,
      integrityStatus: doc.integrityStatus || IntegrityStatus.VERIFIED,
      metadata: doc.metadata || {},
      md5: doc.md5,
      storageBucket: doc.storageBucket,
      source: doc.source,
      description: doc.description || '',
      status: doc.status || EvidenceStatus.UPLOADED,
      tags: doc.tags || [],
      isDeleted: doc.isDeleted || false,
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  private mapToCustodyResponse(doc: any): CustodyLogResponseDto {
    return {
      id: doc._id.toString(),
      evidenceId: doc.evidenceId?.toString?.() || doc.evidenceId,
      caseId: doc.caseId?.toString?.() || doc.caseId,
      action: doc.action,
      performedBy: doc.performedBy,
      sha256AtAction: doc.sha256AtAction,
      details: doc.details,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      timestamp: doc.timestamp?.toISOString?.() || new Date().toISOString(),
    };
  }

  /**
   * Retrieves structured AI forensic analysis for an evidence artifact.
   * Enforces role-based case view authorization.
   */
  async getAnalysisResult(
    evidenceId: string,
    currentUser: UserProfileDto,
  ): Promise<any> {
    const evidence = await this.evidenceModel.findById(evidenceId).exec();
    if (!evidence || evidence.isDeleted) {
      throw new NotFoundException(`Evidence with ID '${evidenceId}' not found`);
    }

    const caseDoc = await this.caseModel.findById(evidence.caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Case with ID '${evidence.caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    const analysis = this.analysisResultModel
      ? await this.analysisResultModel
          .findOne({ evidenceId: evidence._id })
          .sort({ createdAt: -1 })
          .exec()
      : null;

    return {
      evidenceId: evidence._id.toString(),
      caseId: evidence.caseId.toString(),
      fileName: evidence.originalFilename,
      processingStatus: evidence.processingStatus,
      analysisResult: analysis
        ? {
            id: analysis._id.toString(),
            jobId: analysis.jobId,
            status: analysis.status,
            entities: analysis.entities || [],
            entityCounts: analysis.entityCounts || {},
            totalEntities: analysis.totalEntities || 0,
            executionTimeMs: analysis.executionTimeMs || 0,
            error: analysis.error,
            metadata: analysis.metadata,
            createdAt: (analysis as any).createdAt?.toISOString?.() || new Date().toISOString(),
          }
        : null,
    };
  }
}
