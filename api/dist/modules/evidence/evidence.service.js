"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EvidenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceService = exports.EVIDENCE_QUEUE_NAME = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const crypto = require("crypto");
const evidence_schema_1 = require("./schemas/evidence.schema");
const custody_log_schema_1 = require("./schemas/custody-log.schema");
const analysis_result_schema_1 = require("./schemas/analysis-result.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const evidence_storage_interface_1 = require("./storage/evidence-storage.interface");
const evidence_status_enum_1 = require("./enums/evidence-status.enum");
const processing_status_enum_1 = require("./enums/processing-status.enum");
const integrity_status_enum_1 = require("./enums/integrity-status.enum");
const custody_action_enum_1 = require("./enums/custody-action.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const config_1 = require("@nestjs/config");
const evidence_file_validator_1 = require("./validators/evidence-file.validator");
exports.EVIDENCE_QUEUE_NAME = 'evidence-processing';
let EvidenceService = EvidenceService_1 = class EvidenceService {
    constructor(evidenceModel, custodyLogModel, caseModel, storageService, configService, analysisResultModel, evidenceQueue) {
        this.evidenceModel = evidenceModel;
        this.custodyLogModel = custodyLogModel;
        this.caseModel = caseModel;
        this.storageService = storageService;
        this.configService = configService;
        this.analysisResultModel = analysisResultModel;
        this.evidenceQueue = evidenceQueue;
        this.logger = new common_1.Logger(EvidenceService_1.name);
        this.bucketName = this.configService.get('storage.bucketEvidence', 'synapsex-evidence');
    }
    async uploadAndIngest(file, caseId, dto, currentUser, reqContext) {
        (0, evidence_file_validator_1.validateEvidenceFile)(file);
        const caseDoc = await this.caseModel
            .findOne({ _id: caseId, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Case with ID '${caseId}' not found`);
        }
        this.assertCanManageCase(caseDoc, currentUser);
        this.logger.log(`[Pipeline Step 1] Validated file '${file.originalname}' (${file.size} bytes, ${file.mimetype}) for case '${caseDoc.caseNumber}'`);
        const sha256 = crypto
            .createHash('sha256')
            .update(file.buffer)
            .digest('hex');
        const md5 = crypto
            .createHash('md5')
            .update(file.buffer)
            .digest('hex');
        this.logger.log(`[Pipeline Step 2] Generated cryptographic fingerprints - SHA-256: ${sha256}, MD5: ${md5}`);
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
        this.logger.log(`[Pipeline Step 3] Securely stored evidence via storage abstraction: ${this.bucketName}/${storageKey}`);
        const evidenceNumber = await this.generateEvidenceNumber();
        const uploadedAt = new Date();
        const mergedMetadata = {
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
            status: evidence_status_enum_1.EvidenceStatus.QUEUED,
            processingStatus: processing_status_enum_1.ProcessingStatus.UPLOADED,
            integrityStatus: integrity_status_enum_1.IntegrityStatus.VERIFIED,
            metadata: mergedMetadata,
            uploadedBy: new mongoose_2.Types.ObjectId(currentUser.id),
            uploadedAt,
            tags: dto.tags || [],
            isDeleted: false,
            deletedAt: null,
        });
        const savedEvidence = await newEvidence.save();
        this.logger.log(`[Pipeline Step 4] Saved evidence metadata: ${savedEvidence.evidenceNumber} (ID: ${savedEvidence._id})`);
        const initialCustody = new this.custodyLogModel({
            evidenceId: savedEvidence._id,
            caseId: caseDoc._id,
            action: custody_action_enum_1.CustodyAction.UPLOADED,
            performedBy: new mongoose_2.Types.ObjectId(currentUser.id),
            sha256AtAction: sha256,
            details: `Initial forensic evidence artifact '${file.originalname}' ingested. Cryptographic SHA-256 fingerprint: ${sha256}`,
            ipAddress: reqContext?.ip,
            userAgent: reqContext?.userAgent,
            timestamp: uploadedAt,
        });
        const savedCustody = await initialCustody.save();
        this.logger.log(`[Pipeline Step 5] Recorded chain-of-custody entry ID: ${savedCustody._id}`);
        let queueJobId;
        if (this.evidenceQueue) {
            try {
                const job = await this.evidenceQueue.add('evidence.process', {
                    evidenceId: savedEvidence._id.toString(),
                    caseId: caseDoc._id.toString(),
                    storageBucket: this.bucketName,
                    storageKey,
                    sha256,
                    mimeType: file.mimetype,
                    fileSize: savedEvidence.fileSize,
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                });
                queueJobId = job.id;
                savedEvidence.processingStatus = processing_status_enum_1.ProcessingStatus.QUEUED;
                await savedEvidence.save();
                this.logger.log(`[Pipeline Step 6] Enqueued BullMQ ingestion job ${job.id} for evidence ${savedEvidence.evidenceNumber}`);
            }
            catch (err) {
                this.logger.warn(`Could not dispatch BullMQ job: ${err.message}`);
            }
        }
        const response = this.mapToEvidenceResponse(savedEvidence);
        response.initialCustodyRecord = this.mapToCustodyResponse(savedCustody);
        response.queueJobId = queueJobId;
        return response;
    }
    async findByCaseId(caseId, currentUser) {
        const caseDoc = await this.caseModel
            .findOne({ _id: caseId, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Case with ID '${caseId}' not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        const evidenceList = await this.evidenceModel
            .find({ caseId, isDeleted: false })
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'name email role')
            .exec();
        return evidenceList.map((item) => this.mapToEvidenceResponse(item));
    }
    async findById(id, currentUser) {
        const evidenceDoc = await this.evidenceModel
            .findOne({ _id: id, isDeleted: false })
            .populate('uploadedBy', 'name email role')
            .exec();
        if (!evidenceDoc) {
            throw new common_1.NotFoundException(`Evidence with ID '${id}' not found`);
        }
        const caseDoc = await this.caseModel
            .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
            .exec();
        if (caseDoc) {
            this.assertCanViewCase(caseDoc, currentUser);
        }
        return this.mapToEvidenceResponse(evidenceDoc);
    }
    async deleteEvidence(id, currentUser, reqContext) {
        const evidenceDoc = await this.evidenceModel
            .findOne({ _id: id, isDeleted: false })
            .exec();
        if (!evidenceDoc) {
            throw new common_1.NotFoundException(`Evidence with ID '${id}' not found`);
        }
        const caseDoc = await this.caseModel
            .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Associated case not found`);
        }
        this.assertCanManageCase(caseDoc, currentUser);
        evidenceDoc.isDeleted = true;
        evidenceDoc.deletedAt = new Date();
        evidenceDoc.processingStatus = processing_status_enum_1.ProcessingStatus.FAILED;
        await evidenceDoc.save();
        const custodyRecord = new this.custodyLogModel({
            evidenceId: evidenceDoc._id,
            caseId: evidenceDoc.caseId,
            action: custody_action_enum_1.CustodyAction.DISPOSED,
            performedBy: new mongoose_2.Types.ObjectId(currentUser.id),
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
    async getDownloadStream(id, currentUser, reqContext) {
        const evidenceDoc = await this.evidenceModel
            .findOne({ _id: id, isDeleted: false })
            .exec();
        if (!evidenceDoc) {
            throw new common_1.NotFoundException(`Evidence with ID '${id}' not found`);
        }
        const caseDoc = await this.caseModel
            .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Associated case not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        const stream = await this.storageService.getFileStream(evidenceDoc.storageKey, evidenceDoc.storageBucket);
        const custodyRecord = new this.custodyLogModel({
            evidenceId: evidenceDoc._id,
            caseId: evidenceDoc.caseId,
            action: custody_action_enum_1.CustodyAction.ACCESSED,
            performedBy: new mongoose_2.Types.ObjectId(currentUser.id),
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
    async getSecureDownloadUrl(id, currentUser, expiresInSeconds = 3600, reqContext) {
        const evidenceDoc = await this.evidenceModel
            .findOne({ _id: id, isDeleted: false })
            .exec();
        if (!evidenceDoc) {
            throw new common_1.NotFoundException(`Evidence with ID '${id}' not found`);
        }
        const caseDoc = await this.caseModel
            .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Associated case not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        const downloadUrl = await this.storageService.generatePresignedDownloadUrl(evidenceDoc.storageKey, expiresInSeconds, evidenceDoc.storageBucket);
        const custodyRecord = new this.custodyLogModel({
            evidenceId: evidenceDoc._id,
            caseId: evidenceDoc.caseId,
            action: custody_action_enum_1.CustodyAction.ACCESSED,
            performedBy: new mongoose_2.Types.ObjectId(currentUser.id),
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
    async getCustodyChain(evidenceId, currentUser) {
        const evidenceDoc = await this.evidenceModel
            .findOne({ _id: evidenceId, isDeleted: false })
            .exec();
        if (!evidenceDoc) {
            throw new common_1.NotFoundException(`Evidence with ID '${evidenceId}' not found`);
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
    async verifyIntegrity(evidenceId, currentUser, reqContext) {
        const evidenceDoc = await this.evidenceModel
            .findOne({ _id: evidenceId, isDeleted: false })
            .exec();
        if (!evidenceDoc) {
            throw new common_1.NotFoundException(`Evidence with ID '${evidenceId}' not found`);
        }
        const caseDoc = await this.caseModel
            .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
            .exec();
        if (caseDoc) {
            this.assertCanViewCase(caseDoc, currentUser);
        }
        const buffer = await this.storageService.getFileBuffer(evidenceDoc.storageKey, evidenceDoc.storageBucket);
        const computedHash = crypto
            .createHash('sha256')
            .update(buffer)
            .digest('hex');
        const isVerified = computedHash.toLowerCase() === evidenceDoc.sha256.toLowerCase();
        evidenceDoc.integrityStatus = isVerified
            ? integrity_status_enum_1.IntegrityStatus.VERIFIED
            : integrity_status_enum_1.IntegrityStatus.COMPROMISED;
        await evidenceDoc.save();
        const custodyRecord = new this.custodyLogModel({
            evidenceId: evidenceDoc._id,
            caseId: evidenceDoc.caseId,
            action: custody_action_enum_1.CustodyAction.HASH_VERIFIED,
            performedBy: new mongoose_2.Types.ObjectId(currentUser.id),
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
    assertCanManageCase(caseDoc, currentUser) {
        if (currentUser.role === role_enum_1.Role.ADMIN) {
            return;
        }
        if (currentUser.role === role_enum_1.Role.INVESTIGATOR) {
            const isCreator = caseDoc.createdBy.toString() === currentUser.id;
            const isAssigned = caseDoc.assignedUsers.some((userId) => userId.toString() === currentUser.id);
            if (isCreator || isAssigned) {
                return;
            }
            throw new common_1.ForbiddenException('Access denied: You can only manage evidence for cases assigned to you');
        }
        throw new common_1.ForbiddenException('Access denied: You do not have permission to manage evidence for this case');
    }
    assertCanViewCase(caseDoc, currentUser) {
        if (currentUser.role === role_enum_1.Role.ADMIN) {
            return;
        }
        const isCreator = caseDoc.createdBy.toString() === currentUser.id;
        const isAssigned = caseDoc.assignedUsers.some((userId) => userId.toString() === currentUser.id);
        if (isCreator || isAssigned) {
            return;
        }
        throw new common_1.ForbiddenException('Access denied: You are not authorized to access evidence for this case');
    }
    async generateEvidenceNumber() {
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
    mapToEvidenceResponse(doc) {
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
            processingStatus: doc.processingStatus || processing_status_enum_1.ProcessingStatus.PENDING,
            integrityStatus: doc.integrityStatus || integrity_status_enum_1.IntegrityStatus.VERIFIED,
            metadata: doc.metadata || {},
            md5: doc.md5,
            storageBucket: doc.storageBucket,
            source: doc.source,
            description: doc.description || '',
            status: doc.status || evidence_status_enum_1.EvidenceStatus.UPLOADED,
            tags: doc.tags || [],
            isDeleted: doc.isDeleted || false,
            createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
        };
    }
    mapToCustodyResponse(doc) {
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
    async getAnalysisResult(evidenceId, currentUser) {
        const evidence = await this.evidenceModel.findById(evidenceId).exec();
        if (!evidence || evidence.isDeleted) {
            throw new common_1.NotFoundException(`Evidence with ID '${evidenceId}' not found`);
        }
        const caseDoc = await this.caseModel.findById(evidence.caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            throw new common_1.NotFoundException(`Case with ID '${evidence.caseId}' not found`);
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
                    createdAt: analysis.createdAt?.toISOString?.() || new Date().toISOString(),
                }
                : null,
        };
    }
};
exports.EvidenceService = EvidenceService;
exports.EvidenceService = EvidenceService = EvidenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(evidence_schema_1.Evidence.name)),
    __param(1, (0, mongoose_1.InjectModel)(custody_log_schema_1.CustodyLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __param(3, (0, common_1.Inject)(evidence_storage_interface_1.EVIDENCE_STORAGE_SERVICE)),
    __param(5, (0, common_1.Optional)()),
    __param(5, (0, mongoose_1.InjectModel)(analysis_result_schema_1.AnalysisResult.name)),
    __param(6, (0, common_1.Optional)()),
    __param(6, (0, bullmq_1.InjectQueue)(exports.EVIDENCE_QUEUE_NAME)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model, Object, config_1.ConfigService,
        mongoose_2.Model,
        bullmq_2.Queue])
], EvidenceService);
//# sourceMappingURL=evidence.service.js.map