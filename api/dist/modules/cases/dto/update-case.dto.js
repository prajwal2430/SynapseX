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
exports.UpdateCaseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const case_status_enum_1 = require("../enums/case-status.enum");
const case_priority_enum_1 = require("../enums/case-priority.enum");
class UpdateCaseDto {
}
exports.UpdateCaseDto = UpdateCaseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Updated Case Title',
        description: 'Updated title of the investigation',
    }),
    (0, class_validator_1.IsString)({ message: 'Title must be a string' }),
    (0, class_validator_1.MinLength)(3, { message: 'Title must be at least 3 characters long' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Updated detailed description of ongoing findings.',
    }),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.MinLength)(5, { message: 'Description must be at least 5 characters long' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: case_status_enum_1.CaseStatus.IN_PROGRESS,
        enum: case_status_enum_1.CaseStatus,
        description: 'Lifecycle state of the case',
    }),
    (0, class_validator_1.IsEnum)(case_status_enum_1.CaseStatus, {
        message: 'Status must be one of: OPEN, IN_PROGRESS, UNDER_REVIEW, CLOSED, ARCHIVED',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: case_priority_enum_1.CasePriority.CRITICAL,
        enum: case_priority_enum_1.CasePriority,
    }),
    (0, class_validator_1.IsEnum)(case_priority_enum_1.CasePriority, {
        message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['66da81234abcd5678ef01234'],
        description: 'Updated list of assigned user IDs',
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true, message: 'Each assigned user ID must be a valid MongoDB ObjectId' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateCaseDto.prototype, "assignedUsers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['apt29', 'ransomware'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateCaseDto.prototype, "tags", void 0);
//# sourceMappingURL=update-case.dto.js.map