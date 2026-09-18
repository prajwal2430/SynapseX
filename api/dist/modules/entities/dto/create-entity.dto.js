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
exports.CreateEntityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const entity_type_enum_1 = require("../enums/entity-type.enum");
class CreateEntityDto {
    constructor() {
        this.confidence = 1.0;
        this.extractionMethod = 'AI_ANALYSIS';
        this.evidenceStrength = 'MEDIUM';
    }
}
exports.CreateEntityDto = CreateEntityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da91234abcd5678ef05678', description: 'Evidence artifact MongoDB ObjectId' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "evidenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entity_type_enum_1.EntityType, example: entity_type_enum_1.EntityType.IP_ADDRESS }),
    (0, class_validator_1.IsEnum)(entity_type_enum_1.EntityType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.105:8080', description: 'Raw observed entity string' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '192.168.1.105', description: 'Optional explicit normalized value' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "normalizedValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.95, minimum: 0, maximum: 1, default: 1.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateEntityDto.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'syslog.log', description: 'Source file or event channel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'REGEX_DETERMINISTIC', default: 'AI_ANALYSIS' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "extractionMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'], default: 'MEDIUM' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEntityDto.prototype, "evidenceStrength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Arbitrary forensic contextual metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateEntityDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-entity.dto.js.map