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
var CasesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const case_schema_1 = require("./schemas/case.schema");
const role_enum_1 = require("../../common/enums/role.enum");
let CasesService = CasesService_1 = class CasesService {
    constructor(caseModel) {
        this.caseModel = caseModel;
        this.logger = new common_1.Logger(CasesService_1.name);
    }
    async create(createCaseDto, creator) {
        const caseNumber = await this.generateCaseNumber();
        const creatorId = new mongoose_2.Types.ObjectId(creator.id);
        const assignedUserIds = (createCaseDto.assignedUsers || []).map((id) => new mongoose_2.Types.ObjectId(id));
        const hasCreator = assignedUserIds.some((id) => id.equals(creatorId));
        if (!hasCreator) {
            assignedUserIds.push(creatorId);
        }
        const newCase = new this.caseModel({
            caseNumber,
            title: createCaseDto.title.trim(),
            description: createCaseDto.description.trim(),
            priority: createCaseDto.priority,
            tags: createCaseDto.tags || [],
            createdBy: creatorId,
            assignedUsers: assignedUserIds,
            isDeleted: false,
            deletedAt: null,
        });
        const savedCase = await newCase.save();
        this.logger.log(`New case created: ${savedCase.caseNumber} by ${creator.email} (ID: ${savedCase._id})`);
        return this.mapToCaseResponse(savedCase);
    }
    async findAll(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
        const skip = (page - 1) * limit;
        const filter = { isDeleted: false };
        if (query.search && query.search.trim().length > 0) {
            const searchRegex = new RegExp(query.search.trim(), 'i');
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { caseNumber: searchRegex },
            ];
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.priority) {
            filter.priority = query.priority;
        }
        if (query.tag) {
            filter.tags = query.tag.trim();
        }
        if (query.assignedUser) {
            filter.assignedUsers = new mongoose_2.Types.ObjectId(query.assignedUser);
        }
        const sortField = query.sortBy || 'createdAt';
        const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = { [sortField]: sortDirection };
        const [cases, total] = await Promise.all([
            this.caseModel
                .find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'name email role')
                .populate('assignedUsers', 'name email role')
                .exec(),
            this.caseModel.countDocuments(filter).exec(),
        ]);
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            items: cases.map((c) => this.mapToCaseResponse(c)),
            total,
            page,
            limit,
            totalPages,
        };
    }
    async findById(id) {
        const caseDoc = await this.caseModel
            .findOne({ _id: id, isDeleted: false })
            .populate('createdBy', 'name email role')
            .populate('assignedUsers', 'name email role')
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Case with ID '${id}' not found`);
        }
        return this.mapToCaseResponse(caseDoc);
    }
    async update(id, updateCaseDto, currentUser) {
        const caseDoc = await this.caseModel
            .findOne({ _id: id, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Case with ID '${id}' not found`);
        }
        this.assertCanManageCase(caseDoc, currentUser);
        if (updateCaseDto.title) {
            caseDoc.title = updateCaseDto.title.trim();
        }
        if (updateCaseDto.description) {
            caseDoc.description = updateCaseDto.description.trim();
        }
        if (updateCaseDto.status) {
            caseDoc.status = updateCaseDto.status;
        }
        if (updateCaseDto.priority) {
            caseDoc.priority = updateCaseDto.priority;
        }
        if (updateCaseDto.tags) {
            caseDoc.tags = updateCaseDto.tags;
        }
        if (updateCaseDto.assignedUsers) {
            caseDoc.assignedUsers = updateCaseDto.assignedUsers.map((userId) => new mongoose_2.Types.ObjectId(userId));
        }
        const updatedCase = await caseDoc.save();
        this.logger.log(`Case ${caseDoc.caseNumber} updated by ${currentUser.email}`);
        return this.mapToCaseResponse(updatedCase);
    }
    async delete(id, currentUser) {
        const caseDoc = await this.caseModel
            .findOne({ _id: id, isDeleted: false })
            .exec();
        if (!caseDoc) {
            throw new common_1.NotFoundException(`Case with ID '${id}' not found`);
        }
        this.assertCanManageCase(caseDoc, currentUser);
        caseDoc.isDeleted = true;
        caseDoc.deletedAt = new Date();
        await caseDoc.save();
        this.logger.warn(`Case ${caseDoc.caseNumber} soft-deleted by ${currentUser.email}`);
        return {
            deleted: true,
            message: `Case ${caseDoc.caseNumber} successfully deleted`,
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
            throw new common_1.ForbiddenException('Access denied: You can only manage cases that are assigned to you');
        }
        throw new common_1.ForbiddenException('Access denied: You do not have permission to manage cases');
    }
    async generateCaseNumber() {
        const currentYear = new Date().getFullYear();
        const prefix = `CASE-${currentYear}-`;
        const latestCase = await this.caseModel
            .findOne({ caseNumber: new RegExp(`^${prefix}\\d{4}$`) })
            .sort({ caseNumber: -1 })
            .exec();
        let nextNumber = 1;
        if (latestCase && latestCase.caseNumber) {
            const parts = latestCase.caseNumber.split('-');
            const lastSequence = parseInt(parts[2], 10);
            if (!isNaN(lastSequence)) {
                nextNumber = lastSequence + 1;
            }
        }
        const paddedSequence = String(nextNumber).padStart(4, '0');
        return `${prefix}${paddedSequence}`;
    }
    mapToCaseResponse(caseDoc) {
        return {
            id: caseDoc._id.toString(),
            caseNumber: caseDoc.caseNumber,
            title: caseDoc.title,
            description: caseDoc.description,
            status: caseDoc.status,
            priority: caseDoc.priority,
            createdBy: caseDoc.createdBy,
            assignedUsers: caseDoc.assignedUsers || [],
            tags: caseDoc.tags || [],
            isDeleted: caseDoc.isDeleted,
            createdAt: caseDoc.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: caseDoc.updatedAt?.toISOString?.() || new Date().toISOString(),
        };
    }
};
exports.CasesService = CasesService;
exports.CasesService = CasesService = CasesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CasesService);
//# sourceMappingURL=cases.service.js.map