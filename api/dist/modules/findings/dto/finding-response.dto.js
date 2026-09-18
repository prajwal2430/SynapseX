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
exports.FindingResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const review_status_enum_1 = require("../enums/review-status.enum");
class FindingResponseDto {
}
exports.FindingResponseDto = FindingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da91234abcd5678ef09999', description: 'Finding MongoDB ObjectId' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Suspected Data Exfiltration via Encrypted DNS' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Observed anomalous high-frequency DNS queries containing base64 payloads to suspicious domain.' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EXFILTRATION' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "findingType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.88, minimum: 0, maximum: 1 }),
    __metadata("design:type", Number)
], FindingResponseDto.prototype, "confidenceScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'HIGH' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "evidenceStrength", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['66da91234abcd5678ef05678'] }),
    __metadata("design:type", Array)
], FindingResponseDto.prototype, "supportingEvidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['66da91234abcd5678ef07777'] }),
    __metadata("design:type", Array)
], FindingResponseDto.prototype, "supportingEntities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Chain of evidence indicates 45 rapid DNS TXT queries carrying sequential chunk headers matching compromised workstation.' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "reasoning", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Packet capture was truncated; payload decrypted using recovered session key only.' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "limitations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AI_SERVICE' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "generatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: review_status_enum_1.ReviewStatus, example: review_status_enum_1.ReviewStatus.PENDING_REVIEW }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "reviewStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '66da81234abcd5678ef01234', nullable: true }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "reviewedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-06T02:00:00.000Z', nullable: true }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "reviewedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Verified correlation and confirmed exfiltration.' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "reviewComment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:30:00.000Z' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T02:00:00.000Z' }),
    __metadata("design:type", String)
], FindingResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=finding-response.dto.js.map