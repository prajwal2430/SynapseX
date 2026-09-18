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
exports.TimelineQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class TimelineQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 50;
        this.sortBy = 'normalizedTimestamp';
        this.sortOrder = 'asc';
    }
}
exports.TimelineQueryDto = TimelineQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1, minimum: 1, description: 'Page number' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TimelineQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 50, minimum: 1, maximum: 200, description: 'Events per page' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TimelineQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2026-09-01T00:00:00.000Z',
        description: 'Filter events occurring on or after this ISO 8601 timestamp',
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'startDate must be a valid ISO 8601 date string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2026-09-30T23:59:59.999Z',
        description: 'Filter events occurring on or before this ISO 8601 timestamp',
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'endDate must be a valid ISO 8601 date string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'user_logon',
        description: 'Filter by event category or type',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '66da91234abcd5678ef05678',
        description: 'Filter events discovered within a specific evidence artifact',
    }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "evidenceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'auth.log',
        description: 'Filter events by source file or channel',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'workstation',
        description: 'Search matching title or description',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'normalizedTimestamp',
        enum: ['normalizedTimestamp', 'createdAt', 'eventType', 'source', 'title'],
        default: 'normalizedTimestamp',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'asc',
        enum: ['asc', 'desc'],
        default: 'asc',
        description: 'Sort direction (asc for chronological order)',
    }),
    (0, class_validator_1.IsEnum)(['asc', 'desc']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=timeline-query.dto.js.map