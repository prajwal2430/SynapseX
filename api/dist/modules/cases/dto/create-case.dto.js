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
exports.CreateCaseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const case_priority_enum_1 = require("../enums/case-priority.enum");
class CreateCaseDto {
    constructor() {
        this.priority = case_priority_enum_1.CasePriority.MEDIUM;
        this.tags = [];
        this.assignedUsers = [];
    }
}
exports.CreateCaseDto = CreateCaseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Insider Threat Data Exfiltration Investigation',
        description: 'Human-readable title of the investigative case',
        minLength: 3,
    }),
    (0, class_validator_1.IsString)({ message: 'Title must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Title is required' }),
    (0, class_validator_1.MinLength)(3, { message: 'Title must be at least 3 characters long' }),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Unauthorized download of proprietary databases observed on endpoint WKSTN-892.',
        description: 'Detailed scope and description of the incident',
        minLength: 5,
    }),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Description is required' }),
    (0, class_validator_1.MinLength)(5, { message: 'Description must be at least 5 characters long' }),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: case_priority_enum_1.CasePriority.HIGH,
        enum: case_priority_enum_1.CasePriority,
        description: 'Case urgency and severity level (default: MEDIUM)',
    }),
    (0, class_validator_1.IsEnum)(case_priority_enum_1.CasePriority, {
        message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['malware', 'insider-threat', 'q3-audit'],
        description: 'Forensic tags associated with the case',
        type: [String],
    }),
    (0, class_validator_1.IsArray)({ message: 'Tags must be an array of strings' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Each tag must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCaseDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['66da81234abcd5678ef01234'],
        description: 'Array of MongoDB ObjectIds of assigned investigators',
        type: [String],
    }),
    (0, class_validator_1.IsArray)({ message: 'Assigned users must be an array of IDs' }),
    (0, class_validator_1.IsMongoId)({ each: true, message: 'Each assigned user ID must be a valid MongoDB ObjectId' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCaseDto.prototype, "assignedUsers", void 0);
//# sourceMappingURL=create-case.dto.js.map