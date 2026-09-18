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
exports.UploadEvidenceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UploadEvidenceDto {
    constructor() {
        this.tags = [];
    }
}
exports.UploadEvidenceDto = UploadEvidenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Workstation WKSTN-892 Internal NVMe Dump',
        description: 'Origin or source device of the evidence artifact',
        minLength: 2,
    }),
    (0, class_validator_1.IsString)({ message: 'Source must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Source description is required' }),
    (0, class_validator_1.MinLength)(2, { message: 'Source must be at least 2 characters long' }),
    __metadata("design:type", String)
], UploadEvidenceDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Raw disk image acquired during incident response containment phase.',
        description: 'Detailed description of the evidence item',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadEvidenceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['disk-image', 'nvme', 'triage'],
        description: 'Forensic tags associated with this artifact',
        type: [String],
    }),
    (0, class_validator_1.IsArray)({ message: 'Tags must be an array of strings' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Each tag must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UploadEvidenceDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: { hostname: 'WKSTN-892', os: 'Windows 11 Enterprise', examiner: 'Alex Mercer' },
        description: 'Arbitrary custom forensic metadata key-value pairs',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UploadEvidenceDto.prototype, "metadata", void 0);
//# sourceMappingURL=upload-evidence.dto.js.map