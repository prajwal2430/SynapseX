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
var TimelineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const timeline_event_schema_1 = require("./schemas/timeline-event.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const role_enum_1 = require("../../common/enums/role.enum");
const timeline_normalizer_1 = require("./utils/timeline-normalizer");
let TimelineService = TimelineService_1 = class TimelineService {
    constructor(timelineEventModel, caseModel) {
        this.timelineEventModel = timelineEventModel;
        this.caseModel = caseModel;
        this.logger = new common_1.Logger(TimelineService_1.name);
    }
    async findByCaseId(caseId, query, currentUser) {
        const caseDoc = await this.caseModel.findById(caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            throw new common_1.NotFoundException(`Case with ID '${caseId}' not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(200, Math.max(1, query.limit || 50));
        const skip = (page - 1) * limit;
        const filter = {
            caseId: new mongoose_2.Types.ObjectId(caseId),
        };
        if (query.eventType) {
            filter.eventType = query.eventType;
        }
        if (query.evidenceId) {
            filter.evidenceId = new mongoose_2.Types.ObjectId(query.evidenceId);
        }
        if (query.source) {
            filter.source = new RegExp(this.escapeRegex(query.source), 'i');
        }
        if (query.startDate || query.endDate) {
            filter.normalizedTimestamp = {};
            if (query.startDate) {
                filter.normalizedTimestamp.$gte = new Date(query.startDate);
            }
            if (query.endDate) {
                filter.normalizedTimestamp.$lte = new Date(query.endDate);
            }
        }
        if (query.search && query.search.trim()) {
            const searchRegex = new RegExp(this.escapeRegex(query.search.trim()), 'i');
            filter.$or = [{ title: searchRegex }, { description: searchRegex }];
        }
        const sortField = query.sortBy || 'normalizedTimestamp';
        const sortDirection = query.sortOrder === 'desc' ? -1 : 1;
        const sortOptions = { [sortField]: sortDirection };
        const [items, total] = await Promise.all([
            this.timelineEventModel
                .find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.timelineEventModel.countDocuments(filter).exec(),
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
        const event = await this.timelineEventModel.findById(id).exec();
        if (!event) {
            throw new common_1.NotFoundException(`Timeline event with ID '${id}' not found`);
        }
        const caseDoc = await this.caseModel.findById(event.caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            throw new common_1.NotFoundException(`Associated case with ID '${event.caseId}' not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        return this.mapToResponse(event);
    }
    async createTimelineEvent(dto) {
        const normalization = (0, timeline_normalizer_1.parseAndNormalizeTimestamp)(dto.timestamp, dto.timezone);
        const normalizedDate = dto.normalizedTimestamp
            ? new Date(dto.normalizedTimestamp)
            : normalization.normalizedTimestamp;
        const event = new this.timelineEventModel({
            caseId: new mongoose_2.Types.ObjectId(dto.caseId),
            evidenceId: new mongoose_2.Types.ObjectId(dto.evidenceId),
            timestamp: normalization.originalTimestamp,
            timezone: normalization.timezone,
            normalizedTimestamp: isNaN(normalizedDate.getTime()) ? normalization.normalizedTimestamp : normalizedDate,
            eventType: dto.eventType.trim(),
            title: dto.title.trim(),
            description: dto.description?.trim() || '',
            source: dto.source.trim(),
            entities: dto.entities || [],
            metadata: dto.metadata || {},
        });
        return event.save();
    }
    async ingestTimelineEvents(caseId, evidenceId, defaultSource, events) {
        if (!events || events.length === 0) {
            return [];
        }
        const created = [];
        for (const ev of events) {
            try {
                const doc = await this.createTimelineEvent({
                    caseId,
                    evidenceId,
                    timestamp: ev.timestamp,
                    timezone: ev.timezone || 'UTC',
                    eventType: ev.eventType,
                    title: ev.title,
                    description: ev.description,
                    source: ev.source || defaultSource,
                    entities: ev.entities,
                    metadata: ev.metadata,
                });
                created.push(doc);
            }
            catch (err) {
                this.logger.warn(`[TimelineService] Failed to ingest timeline event '${ev.title}': ${err.message}`);
            }
        }
        this.logger.log(`[TimelineService] Successfully ingested ${created.length}/${events.length} timeline events for evidence '${evidenceId}'`);
        return created;
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
        throw new common_1.ForbiddenException('Access denied: You are not authorized to view the timeline for this case');
    }
    mapToResponse(doc) {
        return {
            id: doc._id.toString(),
            caseId: doc.caseId.toString(),
            evidenceId: doc.evidenceId.toString(),
            timestamp: doc.timestamp,
            timezone: doc.timezone,
            normalizedTimestamp: doc.normalizedTimestamp?.toISOString?.() || new Date().toISOString(),
            eventType: doc.eventType,
            title: doc.title,
            description: doc.description || '',
            source: doc.source,
            entities: doc.entities || [],
            metadata: doc.metadata || {},
            createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
        };
    }
    escapeRegex(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
};
exports.TimelineService = TimelineService;
exports.TimelineService = TimelineService = TimelineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(timeline_event_schema_1.TimelineEvent.name)),
    __param(1, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], TimelineService);
//# sourceMappingURL=timeline.service.js.map