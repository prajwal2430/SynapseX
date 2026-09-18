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
exports.EntityResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const entity_type_enum_1 = require("../enums/entity-type.enum");
class EntityResponseDto {
}
exports.EntityResponseDto = EntityResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da91234abcd5678ef07777', description: 'Unique Entity MongoDB ObjectId' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da91234abcd5678ef05678', description: 'Originating Evidence MongoDB ObjectId' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "evidenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entity_type_enum_1.EntityType, example: entity_type_enum_1.EntityType.IP_ADDRESS }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.105:8080' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.105' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "normalizedValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.95, minimum: 0, maximum: 1 }),
    __metadata("design:type", Number)
], EntityResponseDto.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'network_triage.log' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'REGEX_DETERMINISTIC' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "extractionMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MEDIUM' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "evidenceStrength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { context: 'Connection established to remote host' } }),
    __metadata("design:type", Object)
], EntityResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:30:00.000Z' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:30:00.000Z' }),
    __metadata("design:type", String)
], EntityResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=entity-response.dto.js.map