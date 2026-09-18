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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
let AuditService = AuditService_1 = class AuditService {
    constructor(auditLogModel) {
        this.auditLogModel = auditLogModel;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(input) {
        try {
            const userObjectId = input.userId && mongoose_2.Types.ObjectId.isValid(input.userId.toString())
                ? new mongoose_2.Types.ObjectId(input.userId.toString())
                : null;
            const resourceIdStr = input.resourceId ? input.resourceId.toString() : null;
            const auditRecord = new this.auditLogModel({
                userId: userObjectId,
                action: input.action,
                resourceType: input.resourceType,
                resourceId: resourceIdStr,
                timestamp: input.timestamp || new Date(),
                ipAddress: input.ipAddress || null,
                userAgent: input.userAgent || null,
                metadata: input.metadata || {},
            });
            const saved = await auditRecord.save();
            this.logger.debug(`[Audit] Recorded action: '${input.action}' on ${input.resourceType}:${resourceIdStr || 'N/A'} by user '${userObjectId || 'ANONYMOUS'}'`);
            return saved;
        }
        catch (err) {
            this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
            throw err;
        }
    }
    async findLogs(query) {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.userId && mongoose_2.Types.ObjectId.isValid(query.userId)) {
            filter.userId = new mongoose_2.Types.ObjectId(query.userId);
        }
        if (query.action) {
            filter.action = query.action.trim();
        }
        if (query.resourceType) {
            filter.resourceType = query.resourceType.trim();
        }
        if (query.resourceId) {
            filter.resourceId = query.resourceId.trim();
        }
        if (query.startDate || query.endDate) {
            filter.timestamp = {};
            if (query.startDate) {
                filter.timestamp.$gte = new Date(query.startDate);
            }
            if (query.endDate) {
                filter.timestamp.$lte = new Date(query.endDate);
            }
        }
        const [total, records] = await Promise.all([
            this.auditLogModel.countDocuments(filter).exec(),
            this.auditLogModel
                .find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'name email role')
                .exec(),
        ]);
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            data: records.map((doc) => this.mapToResponse(doc)),
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }
    mapToResponse(doc) {
        return {
            id: doc._id.toString(),
            userId: doc.userId,
            action: doc.action,
            resourceType: doc.resourceType,
            resourceId: doc.resourceId || null,
            timestamp: doc.timestamp?.toISOString?.() || new Date(doc.timestamp).toISOString(),
            ipAddress: doc.ipAddress || null,
            userAgent: doc.userAgent || null,
            metadata: doc.metadata || {},
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
//# sourceMappingURL=audit.service.js.map