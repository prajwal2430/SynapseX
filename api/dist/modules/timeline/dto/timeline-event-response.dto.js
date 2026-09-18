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
exports.TimelineEventResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class TimelineEventResponseDto {
}
exports.TimelineEventResponseDto = TimelineEventResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da91234abcd5678ef08888', description: 'Timeline Event MongoDB ObjectId' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da91234abcd5678ef05678', description: 'Originating Evidence MongoDB ObjectId' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "evidenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06 01:15:30.450', description: 'Preserved source timestamp string' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'UTC', description: 'Preserved timezone identifier or offset' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:15:30.450Z', description: 'Standardized UTC moment' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "normalizedTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user_logon' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'User Logon via RDP' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Investigator Alex logged into workstation from 192.168.1.100' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'auth.log' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: [
            { entityType: 'USER', entityValue: 'alex' },
            { entityType: 'IP_ADDRESS', entityValue: '192.168.1.100' },
        ],
    }),
    __metadata("design:type", Array)
], TimelineEventResponseDto.prototype, "entities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { logLine: 42, host: 'WKSTN-892' } }),
    __metadata("design:type", Object)
], TimelineEventResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:16:00.000Z' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:16:00.000Z' }),
    __metadata("design:type", String)
], TimelineEventResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=timeline-event-response.dto.js.map