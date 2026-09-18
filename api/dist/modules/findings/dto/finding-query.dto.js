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
exports.FindingQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const review_status_enum_1 = require("../enums/review-status.enum");
class FindingQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
    }
}
exports.FindingQueryDto = FindingQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1, minimum: 1, description: 'Page number' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FindingQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20, minimum: 1, maximum: 100, description: 'Findings per page' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FindingQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: review_status_enum_1.ReviewStatus,
        description: 'Filter by review lifecycle status (PENDING_REVIEW, APPROVED, REJECTED)',
    }),
    (0, class_validator_1.IsEnum)(review_status_enum_1.ReviewStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindingQueryDto.prototype, "reviewStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'EXFILTRATION',
        description: 'Filter by finding classification type',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindingQueryDto.prototype, "findingType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 0.8,
        minimum: 0,
        maximum: 1,
        description: 'Filter by minimum confidence score',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FindingQueryDto.prototype, "minConfidence", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'],
        description: 'Filter by evidence strength rating',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindingQueryDto.prototype, "evidenceStrength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'exfiltration',
        description: 'Search matching title, description, or reasoning',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindingQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'createdAt',
        enum: ['createdAt', 'confidenceScore', 'findingType', 'reviewStatus'],
        default: 'createdAt',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindingQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'desc',
        enum: ['asc', 'desc'],
        default: 'desc',
    }),
    (0, class_validator_1.IsEnum)(['asc', 'desc']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindingQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=finding-query.dto.js.map