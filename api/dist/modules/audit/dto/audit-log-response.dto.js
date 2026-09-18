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
exports.PaginatedAuditLogsResponseDto = exports.PaginationMetadataDto = exports.AuditLogResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuditLogResponseDto {
}
exports.AuditLogResponseDto = AuditLogResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef09999' }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: () => Object,
        example: '66da81234abcd5678ef01234',
        nullable: true,
        description: 'User ID or populated user profile who performed the action',
    }),
    __metadata("design:type", Object)
], AuditLogResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USER_LOGGED_IN' }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Auth' }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "resourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01234', nullable: true, required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T02:00:00.000Z' }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.100', nullable: true, required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', nullable: true, required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { email: 'investigator@synapsex.local', status: 'success' },
        description: 'Contextual metadata produced by backend service',
    }),
    __metadata("design:type", Object)
], AuditLogResponseDto.prototype, "metadata", void 0);
class PaginationMetadataDto {
}
exports.PaginationMetadataDto = PaginationMetadataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42 }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], PaginationMetadataDto.prototype, "hasNextPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], PaginationMetadataDto.prototype, "hasPrevPage", void 0);
class PaginatedAuditLogsResponseDto {
}
exports.PaginatedAuditLogsResponseDto = PaginatedAuditLogsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AuditLogResponseDto] }),
    __metadata("design:type", Array)
], PaginatedAuditLogsResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: PaginationMetadataDto }),
    __metadata("design:type", PaginationMetadataDto)
], PaginatedAuditLogsResponseDto.prototype, "pagination", void 0);
//# sourceMappingURL=audit-log-response.dto.js.map