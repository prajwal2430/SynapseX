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
var FindingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const finding_schema_1 = require("./schemas/finding.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const audit_service_1 = require("../audit/audit.service");
const review_status_enum_1 = require("./enums/review-status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const common_2 = require("@nestjs/common");
const realtime_events_service_1 = require("../realtime/services/realtime-events.service");
let FindingsService = FindingsService_1 = class FindingsService {
    constructor(findingModel, caseModel, auditService, realtimeEventsService) {
        this.findingModel = findingModel;
        this.caseModel = caseModel;
        this.auditService = auditService;
        this.realtimeEventsService = realtimeEventsService;
        this.logger = new common_1.Logger(FindingsService_1.name);
    }
    async findByCaseId(caseId, query, currentUser) {
        const caseDoc = await this.caseModel.findById(caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            throw new common_1.NotFoundException(`Case with ID '${caseId}' not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;
        const filter = {
            caseId: new mongoose_2.Types.ObjectId(caseId),
        };
        if (query.reviewStatus) {
            filter.reviewStatus = query.reviewStatus;
        }
        if (query.findingType) {
            filter.findingType = query.findingType;
        }
        if (query.minConfidence !== undefined) {
            filter.confidenceScore = { $gte: query.minConfidence };
        }
        if (query.evidenceStrength) {
            filter.evidenceStrength = query.evidenceStrength;
        }
        if (query.search && query.search.trim()) {
            const searchRegex = new RegExp(this.escapeRegex(query.search.trim()), 'i');
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { reasoning: searchRegex },
            ];
        }
        const sortField = query.sortBy || 'createdAt';
        const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };
        const [items, total] = await Promise.all([
            this.findingModel
                .find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.findingModel.countDocuments(filter).exec(),
        ]);
        return {
            items: items.map((doc) => this.mapToResponse(doc)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findById(id, currentUser) {
        const finding = await this.findingModel.findById(id).exec();
        if (!finding) {
            throw new common_1.NotFoundException(`Finding with ID '${id}' not found`);
        }
        const caseDoc = await this.caseModel.findById(finding.caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            throw new common_1.NotFoundException(`Associated case with ID '${finding.caseId}' not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        return this.mapToResponse(finding);
    }
    async approveFinding(id, dto, currentUser, reqContext) {
        const finding = await this.findingModel.findById(id).exec();
        if (!finding) {
            throw new common_1.NotFoundException(`Finding with ID '${id}' not found`);
        }
        const previousStatus = finding.reviewStatus;
        finding.reviewStatus = review_status_enum_1.ReviewStatus.APPROVED;
        finding.reviewedBy = new mongoose_2.Types.ObjectId(currentUser.id);
        finding.reviewedAt = new Date();
        finding.reviewComment = dto.comment?.trim() || '';
        const savedFinding = await finding.save();
        this.logger.log(`[FindingsService] Finding '${id}' APPROVED by ${currentUser.email} (${currentUser.role})`);
        await this.auditService.log({
            userId: currentUser.id,
            action: 'FINDING_APPROVED',
            resourceType: 'Finding',
            resourceId: finding._id.toString(),
            ipAddress: reqContext?.ip,
            userAgent: reqContext?.userAgent,
            metadata: {
                caseId: finding.caseId.toString(),
                findingTitle: finding.title,
                findingType: finding.findingType,
                previousStatus,
                newStatus: review_status_enum_1.ReviewStatus.APPROVED,
                reviewComment: finding.reviewComment,
            },
        });
        return this.mapToResponse(savedFinding);
    }
    async rejectFinding(id, dto, currentUser, reqContext) {
        const finding = await this.findingModel.findById(id).exec();
        if (!finding) {
            throw new common_1.NotFoundException(`Finding with ID '${id}' not found`);
        }
        const previousStatus = finding.reviewStatus;
        finding.reviewStatus = review_status_enum_1.ReviewStatus.REJECTED;
        finding.reviewedBy = new mongoose_2.Types.ObjectId(currentUser.id);
        finding.reviewedAt = new Date();
        finding.reviewComment = dto.comment?.trim() || '';
        const savedFinding = await finding.save();
        this.logger.log(`[FindingsService] Finding '${id}' REJECTED by ${currentUser.email} (${currentUser.role})`);
        await this.auditService.log({
            userId: currentUser.id,
            action: 'FINDING_REJECTED',
            resourceType: 'Finding',
            resourceId: finding._id.toString(),
            ipAddress: reqContext?.ip,
            userAgent: reqContext?.userAgent,
            metadata: {
                caseId: finding.caseId.toString(),
                findingTitle: finding.title,
                findingType: finding.findingType,
                previousStatus,
                newStatus: review_status_enum_1.ReviewStatus.REJECTED,
                reviewComment: finding.reviewComment,
            },
        });
        return this.mapToResponse(savedFinding);
    }
    async createFinding(dto) {
        const finding = new this.findingModel({
            caseId: new mongoose_2.Types.ObjectId(dto.caseId),
            title: dto.title.trim(),
            description: dto.description.trim(),
            findingType: dto.findingType.trim(),
            confidenceScore: dto.confidenceScore,
            evidenceStrength: dto.evidenceStrength || 'MEDIUM',
            supportingEvidence: (dto.supportingEvidence || []).map((id) => new mongoose_2.Types.ObjectId(id)),
            supportingEntities: (dto.supportingEntities || []).map((id) => new mongoose_2.Types.ObjectId(id)),
            reasoning: dto.reasoning.trim(),
            limitations: dto.limitations?.trim() || '',
            generatedBy: dto.generatedBy || 'AI_SERVICE',
            reviewStatus: review_status_enum_1.ReviewStatus.PENDING_REVIEW,
            reviewedBy: null,
            reviewedAt: null,
            reviewComment: '',
        });
        const saved = await finding.save();
        this.realtimeEventsService?.emitFindingCreated(saved.caseId.toString(), {
            findingId: saved._id.toString(),
            title: saved.title,
            findingType: saved.findingType,
            confidenceScore: saved.confidenceScore,
            generatedBy: saved.generatedBy,
        });
        return saved;
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
        throw new common_1.ForbiddenException('Access denied: You are not authorized to view findings for this case');
    }
    mapToResponse(doc) {
        return {
            id: doc._id.toString(),
            caseId: doc.caseId.toString(),
            title: doc.title,
            description: doc.description,
            findingType: doc.findingType,
            confidenceScore: doc.confidenceScore,
            evidenceStrength: doc.evidenceStrength,
            supportingEvidence: (doc.supportingEvidence || []).map((id) => id.toString()),
            supportingEntities: (doc.supportingEntities || []).map((id) => id.toString()),
            reasoning: doc.reasoning,
            limitations: doc.limitations || '',
            generatedBy: doc.generatedBy,
            reviewStatus: doc.reviewStatus,
            reviewedBy: doc.reviewedBy ? doc.reviewedBy.toString() : null,
            reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
            reviewComment: doc.reviewComment || '',
            createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
        };
    }
    escapeRegex(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
};
exports.FindingsService = FindingsService;
exports.FindingsService = FindingsService = FindingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(finding_schema_1.Finding.name)),
    __param(1, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __param(3, (0, common_2.Optional)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        realtime_events_service_1.RealtimeEventsService])
], FindingsService);
//# sourceMappingURL=findings.service.js.map