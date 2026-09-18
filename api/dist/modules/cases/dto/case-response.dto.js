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
exports.DeleteCaseResponseDto = exports.CaseResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const case_status_enum_1 = require("../enums/case-status.enum");
const case_priority_enum_1 = require("../enums/case-priority.enum");
class CaseResponseDto {
}
exports.CaseResponseDto = CaseResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef05678' }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CASE-2026-0001' }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "caseNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Insider Threat Data Exfiltration Investigation' }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Unauthorized download of proprietary databases.' }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: case_status_enum_1.CaseStatus, example: case_status_enum_1.CaseStatus.OPEN }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: case_priority_enum_1.CasePriority, example: case_priority_enum_1.CasePriority.HIGH }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => Object, example: '66da81234abcd5678ef01234' }),
    __metadata("design:type", Object)
], CaseResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [Object], example: ['66da81234abcd5678ef01234'] }),
    __metadata("design:type", Array)
], CaseResponseDto.prototype, "assignedUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['insider-threat', 'exfiltration'] }),
    __metadata("design:type", Array)
], CaseResponseDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], CaseResponseDto.prototype, "isDeleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:42:00.000Z' }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:42:00.000Z' }),
    __metadata("design:type", String)
], CaseResponseDto.prototype, "updatedAt", void 0);
class DeleteCaseResponseDto {
}
exports.DeleteCaseResponseDto = DeleteCaseResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], DeleteCaseResponseDto.prototype, "deleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Case CASE-2026-0001 successfully deleted' }),
    __metadata("design:type", String)
], DeleteCaseResponseDto.prototype, "message", void 0);
//# sourceMappingURL=case-response.dto.js.map