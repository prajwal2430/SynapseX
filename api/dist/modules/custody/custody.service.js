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
var CustodyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustodyService = exports.CUSTODY_LEGAL_DISCLAIMER = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chain_of_custody_schema_1 = require("./schemas/chain-of-custody.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const evidence_schema_1 = require("../evidence/schemas/evidence.schema");
const chain_of_custody_response_dto_1 = require("./dto/chain-of-custody-response.dto");
const role_enum_1 = require("../../common/enums/role.enum");
const custody_hash_util_1 = require("./utils/custody-hash.util");
exports.CUSTODY_LEGAL_DISCLAIMER = 'Notice: SynapseX tamper-evident custody logging provides mathematical audit integrity and cryptographic non-repudiation within the platform. It does not constitute legal or court certification.';
let CustodyService = CustodyService_1 = class CustodyService {
    constructor(custodyModel, evidenceModel, caseModel) {
        this.custodyModel = custodyModel;
        this.evidenceModel = evidenceModel;
        this.caseModel = caseModel;
        this.logger = new common_1.Logger(CustodyService_1.name);
    }
    async appendRecord(input) {
        const evidenceObjectId = new mongoose_2.Types.ObjectId(input.evidenceId.toString());
        const caseObjectId = new mongoose_2.Types.ObjectId(input.caseId.toString());
        const actorObjectId = new mongoose_2.Types.ObjectId(input.actorId.toString());
        const timestamp = input.timestamp || new Date();
        const latestRecord = await this.custodyModel
            .findOne({ evidenceId: evidenceObjectId })
            .sort({ sequenceNumber: -1 })
            .exec();
        let sequenceNumber = 1;
        let previousRecordHash = chain_of_custody_schema_1.GENESIS_HASH;
        if (latestRecord) {
            sequenceNumber = latestRecord.sequenceNumber + 1;
            previousRecordHash = latestRecord.recordHash;
        }
        const metadata = input.metadata || {};
        const recordHash = (0, custody_hash_util_1.computeCustodyRecordHash)({
            evidenceId: evidenceObjectId.toString(),
            caseId: caseObjectId.toString(),
            action: input.action,
            actorId: actorObjectId.toString(),
            timestamp,
            sequenceNumber,
            previousRecordHash,
            metadata,
        });
        const newRecord = new this.custodyModel({
            evidenceId: evidenceObjectId,
            caseId: caseObjectId,
            action: input.action,
            actorId: actorObjectId,
            timestamp,
            sequenceNumber,
            metadata,
            previousRecordHash,
            recordHash,
        });
        const savedRecord = await newRecord.save();
        this.logger.log(`[Tamper-Evident Custody] Appended block seq #${sequenceNumber} (${input.action}) for evidence '${evidenceObjectId}' - Hash: ${recordHash.substring(0, 16)}...`);
        return savedRecord;
    }
    async getChainByEvidenceId(evidenceId, currentUser) {
        await this.assertCaseAccessForEvidence(evidenceId, currentUser);
        const records = await this.custodyModel
            .find({ evidenceId: new mongoose_2.Types.ObjectId(evidenceId) })
            .sort({ sequenceNumber: 1 })
            .populate('actorId', 'name email role')
            .exec();
        return records.map((record) => this.mapToResponse(record));
    }
    async verifyChain(evidenceId, currentUser) {
        await this.assertCaseAccessForEvidence(evidenceId, currentUser);
        const records = await this.custodyModel
            .find({ evidenceId: new mongoose_2.Types.ObjectId(evidenceId) })
            .sort({ sequenceNumber: 1 })
            .exec();
        const verifiedAt = new Date().toISOString();
        if (!records || records.length === 0) {
            return {
                isValid: true,
                status: chain_of_custody_response_dto_1.ChainVerificationStatus.EMPTY_CHAIN,
                totalRecords: 0,
                chainHeadHash: null,
                verifiedAt,
                message: 'No custody records found for this evidence artifact.',
                disclaimer: exports.CUSTODY_LEGAL_DISCLAIMER,
            };
        }
        for (let i = 0; i < records.length; i++) {
            const current = records[i];
            if (i === 0) {
                if (current.sequenceNumber !== 1) {
                    return {
                        isValid: false,
                        status: chain_of_custody_response_dto_1.ChainVerificationStatus.MISSING_RECORD,
                        totalRecords: records.length,
                        chainHeadHash: records[records.length - 1].recordHash,
                        verifiedAt,
                        message: `Missing initial record: Genesis block sequence is ${current.sequenceNumber}, expected 1.`,
                        details: {
                            brokenRecordId: current._id.toString(),
                            sequenceNumber: current.sequenceNumber,
                            expectedSequence: 1,
                        },
                        disclaimer: exports.CUSTODY_LEGAL_DISCLAIMER,
                    };
                }
                if (current.previousRecordHash !== chain_of_custody_schema_1.GENESIS_HASH) {
                    return {
                        isValid: false,
                        status: chain_of_custody_response_dto_1.ChainVerificationStatus.BROKEN_CHAIN,
                        totalRecords: records.length,
                        chainHeadHash: records[records.length - 1].recordHash,
                        verifiedAt,
                        message: `Genesis record does not reference ${chain_of_custody_schema_1.GENESIS_HASH}.`,
                        details: {
                            brokenRecordId: current._id.toString(),
                            sequenceNumber: 1,
                            actualPreviousHash: current.previousRecordHash,
                        },
                        disclaimer: exports.CUSTODY_LEGAL_DISCLAIMER,
                    };
                }
            }
            if (i > 0) {
                const previous = records[i - 1];
                if (current.sequenceNumber !== previous.sequenceNumber + 1) {
                    return {
                        isValid: false,
                        status: chain_of_custody_response_dto_1.ChainVerificationStatus.MISSING_RECORD,
                        totalRecords: records.length,
                        chainHeadHash: records[records.length - 1].recordHash,
                        verifiedAt,
                        message: `Missing record in custody chain: sequence jumped from #${previous.sequenceNumber} to #${current.sequenceNumber}.`,
                        details: {
                            precedingSequence: previous.sequenceNumber,
                            encounteredSequence: current.sequenceNumber,
                            expectedSequence: previous.sequenceNumber + 1,
                        },
                        disclaimer: exports.CUSTODY_LEGAL_DISCLAIMER,
                    };
                }
                if (current.previousRecordHash !== previous.recordHash) {
                    return {
                        isValid: false,
                        status: chain_of_custody_response_dto_1.ChainVerificationStatus.BROKEN_CHAIN,
                        totalRecords: records.length,
                        chainHeadHash: records[records.length - 1].recordHash,
                        verifiedAt,
                        message: `Broken chain pointer at sequence #${current.sequenceNumber}: previousRecordHash does not match record #${previous.sequenceNumber} hash.`,
                        details: {
                            sequenceNumber: current.sequenceNumber,
                            expectedPreviousHash: previous.recordHash,
                            actualPreviousHash: current.previousRecordHash,
                        },
                        disclaimer: exports.CUSTODY_LEGAL_DISCLAIMER,
                    };
                }
            }
            const recomputedHash = (0, custody_hash_util_1.computeCustodyRecordHash)({
                evidenceId: current.evidenceId.toString(),
                caseId: current.caseId.toString(),
                action: current.action,
                actorId: current.actorId.toString(),
                timestamp: current.timestamp,
                sequenceNumber: current.sequenceNumber,
                previousRecordHash: current.previousRecordHash,
                metadata: current.metadata,
            });
            if (recomputedHash !== current.recordHash) {
                return {
                    isValid: false,
                    status: chain_of_custody_response_dto_1.ChainVerificationStatus.TAMPERED_RECORD,
                    totalRecords: records.length,
                    chainHeadHash: records[records.length - 1].recordHash,
                    verifiedAt,
                    message: `Tamper detected in record sequence #${current.sequenceNumber}: computed SHA-256 hash does not match stored hash.`,
                    details: {
                        sequenceNumber: current.sequenceNumber,
                        storedHash: current.recordHash,
                        recomputedHash,
                    },
                    disclaimer: exports.CUSTODY_LEGAL_DISCLAIMER,
                };
            }
        }
        const headHash = records[records.length - 1].recordHash;
        return {
            isValid: true,
            status: chain_of_custody_response_dto_1.ChainVerificationStatus.VERIFIED,
            totalRecords: records.length,
            chainHeadHash: headHash,
            verifiedAt,
            message: 'Tamper-evident custody verification passed: All custody blocks and cryptographic hash pointers are intact and unaltered.',
            disclaimer: exports.CUSTODY_LEGAL_DISCLAIMER,
        };
    }
    async assertCaseAccessForEvidence(evidenceId, currentUser) {
        const evidenceDoc = await this.evidenceModel
            .findOne({ _id: evidenceId, isDeleted: false })
            .exec();
        if (!evidenceDoc) {
            throw new common_1.NotFoundException(`Evidence artifact '${evidenceId}' not found`);
        }
        const caseDoc = await this.caseModel
            .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Associated case for evidence '${evidenceId}' not found`);
        }
        if (currentUser.role === role_enum_1.Role.ADMIN) {
            return { evidence: evidenceDoc, caseDoc };
        }
        const isCreator = caseDoc.createdBy.toString() === currentUser.id;
        const isAssigned = caseDoc.assignedUsers.some((userId) => userId.toString() === currentUser.id);
        if (isCreator || isAssigned) {
            return { evidence: evidenceDoc, caseDoc };
        }
        throw new common_1.ForbiddenException('Access denied: You are not authorized to view the chain of custody for this case');
    }
    mapToResponse(doc) {
        return {
            id: doc._id.toString(),
            evidenceId: doc.evidenceId?.toString?.() || doc.evidenceId,
            caseId: doc.caseId?.toString?.() || doc.caseId,
            action: doc.action,
            actorId: doc.actorId,
            timestamp: doc.timestamp?.toISOString?.() || new Date(doc.timestamp).toISOString(),
            sequenceNumber: doc.sequenceNumber,
            metadata: doc.metadata || {},
            previousRecordHash: doc.previousRecordHash,
            recordHash: doc.recordHash,
        };
    }
};
exports.CustodyService = CustodyService;
exports.CustodyService = CustodyService = CustodyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chain_of_custody_schema_1.ChainOfCustody.name)),
    __param(1, (0, mongoose_1.InjectModel)(evidence_schema_1.Evidence.name)),
    __param(2, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], CustodyService);
//# sourceMappingURL=custody.service.js.map