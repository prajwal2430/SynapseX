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
var EntitiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitiesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const entity_schema_1 = require("./schemas/entity.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const role_enum_1 = require("../../common/enums/role.enum");
const entity_normalizer_1 = require("./utils/entity-normalizer");
const entity_type_enum_1 = require("./enums/entity-type.enum");
let EntitiesService = EntitiesService_1 = class EntitiesService {
    constructor(entityModel, caseModel) {
        this.entityModel = entityModel;
        this.caseModel = caseModel;
        this.logger = new common_1.Logger(EntitiesService_1.name);
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
        if (query.type) {
            filter.type = query.type;
        }
        if (query.evidenceId) {
            filter.evidenceId = new mongoose_2.Types.ObjectId(query.evidenceId);
        }
        if (query.minConfidence !== undefined) {
            filter.confidence = { $gte: query.minConfidence };
        }
        if (query.source) {
            filter.source = new RegExp(this.escapeRegex(query.source), 'i');
        }
        if (query.search && query.search.trim()) {
            const searchRegex = new RegExp(this.escapeRegex(query.search.trim()), 'i');
            filter.$or = [
                { value: searchRegex },
                { normalizedValue: searchRegex },
            ];
        }
        const sortField = query.sortBy || 'createdAt';
        const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };
        const [items, total] = await Promise.all([
            this.entityModel
                .find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.entityModel.countDocuments(filter).exec(),
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
        const entity = await this.entityModel.findById(id).exec();
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with ID '${id}' not found`);
        }
        const caseDoc = await this.caseModel.findById(entity.caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            throw new common_1.NotFoundException(`Associated case with ID '${entity.caseId}' not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        return this.mapToResponse(entity);
    }
    async upsertEntity(dto) {
        const normalizedValue = dto.normalizedValue?.trim() ||
            (0, entity_normalizer_1.normalizeEntityValue)(dto.type, dto.value);
        const filter = {
            caseId: new mongoose_2.Types.ObjectId(dto.caseId),
            evidenceId: new mongoose_2.Types.ObjectId(dto.evidenceId),
            type: dto.type,
            normalizedValue,
        };
        const existing = await this.entityModel.findOne(filter).exec();
        if (existing) {
            const incomingConfidence = typeof dto.confidence === 'number' ? dto.confidence : 1.0;
            existing.confidence = Math.max(existing.confidence, incomingConfidence);
            existing.metadata = {
                ...(existing.metadata || {}),
                ...(dto.metadata || {}),
                occurrences: (existing.metadata?.occurrences || 1) + 1,
                lastSeen: new Date().toISOString(),
            };
            return existing.save();
        }
        const newEntity = new this.entityModel({
            caseId: new mongoose_2.Types.ObjectId(dto.caseId),
            evidenceId: new mongoose_2.Types.ObjectId(dto.evidenceId),
            type: dto.type,
            value: dto.value.trim(),
            normalizedValue,
            confidence: typeof dto.confidence === 'number' ? dto.confidence : 1.0,
            source: dto.source.trim(),
            extractionMethod: dto.extractionMethod || 'AI_ANALYSIS',
            evidenceStrength: dto.evidenceStrength || 'MEDIUM',
            metadata: {
                ...(dto.metadata || {}),
                occurrences: 1,
                firstSeen: new Date().toISOString(),
            },
        });
        return newEntity.save();
    }
    async ingestExtractedEntities(caseId, evidenceId, defaultSource, rawEntities) {
        if (!rawEntities || rawEntities.length === 0) {
            return [];
        }
        const results = [];
        for (const item of rawEntities) {
            const mappedType = this.mapRawTypeToEntityType(item.entityType);
            if (!mappedType || !item.entityValue) {
                continue;
            }
            try {
                const entityDoc = await this.upsertEntity({
                    caseId,
                    evidenceId,
                    type: mappedType,
                    value: item.entityValue,
                    normalizedValue: item.normalizedValue,
                    confidence: item.confidence,
                    source: item.source || defaultSource,
                    extractionMethod: 'AI_ANALYSIS',
                    evidenceStrength: 'MEDIUM',
                    metadata: item.context ? { context: item.context } : {},
                });
                results.push(entityDoc);
            }
            catch (err) {
                this.logger.warn(`[EntitiesService] Duplicate or insertion error for entity '${item.entityValue}': ${err.message}`);
            }
        }
        this.logger.log(`[EntitiesService] Successfully ingested ${results.length}/${rawEntities.length} entities for evidence '${evidenceId}' in case '${caseId}'`);
        return results;
    }
    mapRawTypeToEntityType(rawType) {
        if (!rawType)
            return null;
        const upper = rawType.toUpperCase().replace(/[- ]/g, '_');
        switch (upper) {
            case 'PERSON':
                return entity_type_enum_1.EntityType.PERSON;
            case 'USER':
            case 'USER_ACCOUNT':
            case 'ACCOUNT':
                return entity_type_enum_1.EntityType.USER;
            case 'EMAIL':
            case 'EMAIL_ADDRESS':
                return entity_type_enum_1.EntityType.EMAIL;
            case 'IP':
            case 'IP_ADDRESS':
            case 'IPV4':
            case 'IPV6':
                return entity_type_enum_1.EntityType.IP_ADDRESS;
            case 'DEVICE':
            case 'HARDWARE':
            case 'USB':
                return entity_type_enum_1.EntityType.DEVICE;
            case 'FILE':
            case 'FILE_PATH':
            case 'HASH':
            case 'SHA256':
            case 'MD5':
                return entity_type_enum_1.EntityType.FILE;
            case 'DOMAIN':
            case 'HOSTNAME':
            case 'FQDN':
            case 'URL':
                return entity_type_enum_1.EntityType.DOMAIN;
            case 'LOCATION':
            case 'GEO':
                return entity_type_enum_1.EntityType.LOCATION;
            default:
                if (Object.values(entity_type_enum_1.EntityType).includes(upper)) {
                    return upper;
                }
                return null;
        }
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
        throw new common_1.ForbiddenException('Access denied: You are not authorized to access entities for this case');
    }
    mapToResponse(doc) {
        return {
            id: doc._id.toString(),
            caseId: doc.caseId.toString(),
            evidenceId: doc.evidenceId.toString(),
            type: doc.type,
            value: doc.value,
            normalizedValue: doc.normalizedValue,
            confidence: doc.confidence,
            source: doc.source,
            extractionMethod: doc.extractionMethod,
            evidenceStrength: doc.evidenceStrength,
            metadata: doc.metadata || {},
            createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
        };
    }
    escapeRegex(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
};
exports.EntitiesService = EntitiesService;
exports.EntitiesService = EntitiesService = EntitiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(entity_schema_1.Entity.name)),
    __param(1, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], EntitiesService);
//# sourceMappingURL=entities.service.js.map