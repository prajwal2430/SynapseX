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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const case_status_enum_1 = require("../enums/case-status.enum");
const case_priority_enum_1 = require("../enums/case-priority.enum");
class CaseQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
    }
}
exports.CaseQueryDto = CaseQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, minimum: 1, default: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CaseQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20, minimum: 1, maximum: 100, default: 20 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CaseQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'exfiltration',
        description: 'Full-text query matching caseNumber, title, or description',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: case_status_enum_1.CaseStatus,
        description: 'Filter by case lifecycle status',
    }),
    (0, class_validator_1.IsEnum)(case_status_enum_1.CaseStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: case_priority_enum_1.CasePriority,
        description: 'Filter by priority level',
    }),
    (0, class_validator_1.IsEnum)(case_priority_enum_1.CasePriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseQueryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'malware',
        description: 'Filter cases containing a specific tag',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseQueryDto.prototype, "tag", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '66da81234abcd5678ef01234',
        description: 'Filter cases assigned to a specific investigator ID',
    }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseQueryDto.prototype, "assignedUser", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'createdAt',
        enum: ['createdAt', 'updatedAt', 'priority', 'status', 'caseNumber', 'title'],
        default: 'createdAt',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'desc',
        enum: ['asc', 'desc'],
        default: 'desc',
    }),
    (0, class_validator_1.IsEnum)(['asc', 'desc']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=case-query.dto.js.map