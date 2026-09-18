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
exports.VerifyChainResponseDto = exports.ChainOfCustodyResponseDto = exports.ChainVerificationStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const custody_action_enum_1 = require("../enums/custody-action.enum");
var ChainVerificationStatus;
(function (ChainVerificationStatus) {
    ChainVerificationStatus["VERIFIED"] = "VERIFIED";
    ChainVerificationStatus["BROKEN_CHAIN"] = "BROKEN_CHAIN";
    ChainVerificationStatus["MISSING_RECORD"] = "MISSING_RECORD";
    ChainVerificationStatus["TAMPERED_RECORD"] = "TAMPERED_RECORD";
    ChainVerificationStatus["EMPTY_CHAIN"] = "EMPTY_CHAIN";
})(ChainVerificationStatus || (exports.ChainVerificationStatus = ChainVerificationStatus = {}));
class ChainOfCustodyResponseDto {
}
exports.ChainOfCustodyResponseDto = ChainOfCustodyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da89994abcd5678ef09999' }),
    __metadata("design:type", String)
], ChainOfCustodyResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef05678' }),
    __metadata("design:type", String)
], ChainOfCustodyResponseDto.prototype, "evidenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01234' }),
    __metadata("design:type", String)
], ChainOfCustodyResponseDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: custody_action_enum_1.CustodyAction, example: custody_action_enum_1.CustodyAction.UPLOADED }),
    __metadata("design:type", String)
], ChainOfCustodyResponseDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => Object, example: '66da81234abcd5678ef01234' }),
    __metadata("design:type", Object)
], ChainOfCustodyResponseDto.prototype, "actorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T02:00:00.000Z' }),
    __metadata("design:type", String)
], ChainOfCustodyResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Monotonically increasing sequence number' }),
    __metadata("design:type", Number)
], ChainOfCustodyResponseDto.prototype, "sequenceNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { ip: '192.168.1.100', userAgent: 'Mozilla/5.0 ...' },
        description: 'Contextual forensic metadata recorded at the time of the action',
    }),
    __metadata("design:type", Object)
], ChainOfCustodyResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'GENESIS',
        description: 'SHA-256 hash of the immediate preceding custody record (or GENESIS for record 1)',
    }),
    __metadata("design:type", String)
], ChainOfCustodyResponseDto.prototype, "previousRecordHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'd9b3d0c95d9e5a1b5c9287c807b1a6d40bf420404a011733cfb7b190d62c65bf',
        description: 'Cryptographic SHA-256 hash generated across this record and its previous hash',
    }),
    __metadata("design:type", String)
], ChainOfCustodyResponseDto.prototype, "recordHash", void 0);
class VerifyChainResponseDto {
}
exports.VerifyChainResponseDto = VerifyChainResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'True if the chain has zero tampering or gaps' }),
    __metadata("design:type", Boolean)
], VerifyChainResponseDto.prototype, "isValid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ChainVerificationStatus,
        example: ChainVerificationStatus.VERIFIED,
        description: 'Tamper-evident verification status',
    }),
    __metadata("design:type", String)
], VerifyChainResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: 'Total verified custody blocks in the ledger' }),
    __metadata("design:type", Number)
], VerifyChainResponseDto.prototype, "totalRecords", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'd9b3d0c95d9e5a1b5c9287c807b1a6d40bf420404a011733cfb7b190d62c65bf',
        description: 'Current cryptographic head hash of the custody chain',
        nullable: true,
    }),
    __metadata("design:type", String)
], VerifyChainResponseDto.prototype, "chainHeadHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T02:05:00.000Z' }),
    __metadata("design:type", String)
], VerifyChainResponseDto.prototype, "verifiedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Tamper-evident custody verification passed: Chain is unbroken and authentic.' }),
    __metadata("design:type", String)
], VerifyChainResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { brokenSequenceIndex: null, anomalyReason: null },
        required: false,
    }),
    __metadata("design:type", Object)
], VerifyChainResponseDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Notice: SynapseX tamper-evident custody logging provides cryptographic audit integrity within the platform. It does not constitute legal or court certification.',
    }),
    __metadata("design:type", String)
], VerifyChainResponseDto.prototype, "disclaimer", void 0);
//# sourceMappingURL=chain-of-custody-response.dto.js.map