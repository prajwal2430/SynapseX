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
exports.VerifyHashResponseDto = exports.EvidenceResponseDto = exports.CustodyLogResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const evidence_status_enum_1 = require("../enums/evidence-status.enum");
const processing_status_enum_1 = require("../enums/processing-status.enum");
const integrity_status_enum_1 = require("../enums/integrity-status.enum");
const custody_action_enum_1 = require("../enums/custody-action.enum");
class CustodyLogResponseDto {
}
exports.CustodyLogResponseDto = CustodyLogResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da89994abcd5678ef09999' }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef05678' }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "evidenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01234' }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: custody_action_enum_1.CustodyAction, example: custody_action_enum_1.CustodyAction.UPLOADED }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => Object, example: '66da81234abcd5678ef01234' }),
    __metadata("design:type", Object)
], CustodyLogResponseDto.prototype, "performedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        description: 'Cryptographic SHA-256 hash verified at time of this action',
    }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "sha256AtAction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Initial evidence upload into secure object storage vault' }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.105', required: false }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mozilla/5.0 ...', required: false }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:45:00.000Z' }),
    __metadata("design:type", String)
], CustodyLogResponseDto.prototype, "timestamp", void 0);
class EvidenceResponseDto {
}
exports.EvidenceResponseDto = EvidenceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef05678' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01234' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EV-2026-0001' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "evidenceNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'memory_dump_wkstn892.raw' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "originalFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cases/66da81234abcd5678ef01234/1772761500000-a591a6d40bf4-memory.raw' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "storageKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'application/octet-stream' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4294967296, description: 'File size in bytes' }),
    __metadata("design:type", Number)
], EvidenceResponseDto.prototype, "fileSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4294967296, description: 'Alias for fileSize in bytes' }),
    __metadata("design:type", Number)
], EvidenceResponseDto.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
        description: 'Cryptographic SHA-256 fingerprint generated upon upload',
    }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "sha256", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => Object, example: '66da81234abcd5678ef01234' }),
    __metadata("design:type", Object)
], EvidenceResponseDto.prototype, "uploadedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:45:00.000Z' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "uploadedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: processing_status_enum_1.ProcessingStatus,
        example: processing_status_enum_1.ProcessingStatus.PENDING,
        description: 'Current background/analysis processing status',
    }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "processingStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: integrity_status_enum_1.IntegrityStatus,
        example: integrity_status_enum_1.IntegrityStatus.VERIFIED,
        description: 'Cryptographic integrity check status',
    }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "integrityStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { source: 'Workstation NVMe', tags: ['triage', 'memory'] },
        description: 'Arbitrary forensic metadata key-value store',
    }),
    __metadata("design:type", Object)
], EvidenceResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'c3499c2729730a7f807efb8676a92dcb', required: false }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "md5", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'synapsex-evidence' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "storageBucket", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Workstation WKSTN-892 Internal NVMe Dump' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Raw disk image acquired during containment' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: evidence_status_enum_1.EvidenceStatus, example: evidence_status_enum_1.EvidenceStatus.QUEUED }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['disk-image', 'nvme'] }),
    __metadata("design:type", Array)
], EvidenceResponseDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], EvidenceResponseDto.prototype, "isDeleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:45:00.000Z' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:45:00.000Z' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => CustodyLogResponseDto, required: false }),
    __metadata("design:type", CustodyLogResponseDto)
], EvidenceResponseDto.prototype, "initialCustodyRecord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'job-123', required: false }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "queueJobId", void 0);
class VerifyHashResponseDto {
}
exports.VerifyHashResponseDto = VerifyHashResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EV-2026-0001' }),
    __metadata("design:type", String)
], VerifyHashResponseDto.prototype, "evidenceNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], VerifyHashResponseDto.prototype, "verified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' }),
    __metadata("design:type", String)
], VerifyHashResponseDto.prototype, "recordedHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' }),
    __metadata("design:type", String)
], VerifyHashResponseDto.prototype, "computedHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cryptographic integrity intact: computed SHA-256 matches recorded value' }),
    __metadata("design:type", String)
], VerifyHashResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => CustodyLogResponseDto }),
    __metadata("design:type", CustodyLogResponseDto)
], VerifyHashResponseDto.prototype, "custodyLog", void 0);
//# sourceMappingURL=evidence-response.dto.js.map