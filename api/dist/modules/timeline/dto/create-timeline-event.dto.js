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
exports.CreateTimelineEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateTimelineEventDto {
    constructor() {
        this.timezone = 'UTC';
        this.description = '';
    }
}
exports.CreateTimelineEventDto = CreateTimelineEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '66da91234abcd5678ef05678', description: 'Evidence artifact MongoDB ObjectId' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "evidenceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06 01:15:30.450', description: 'Original raw timestamp as observed in source evidence' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'UTC', default: 'UTC', description: 'Source timezone or UTC offset string' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-06T01:15:30.450Z', description: 'Optional pre-normalized UTC timestamp string' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "normalizedTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user_logon', description: 'Event classification' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'User Logon via RDP', description: 'Short summary title of the forensic event' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Investigator Alex logged into workstation from 192.168.1.100' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'auth.log', description: 'Originating log, capture, or forensic file' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimelineEventDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: [
            { entityType: 'USER', entityValue: 'alex' },
            { entityType: 'IP_ADDRESS', entityValue: '192.168.1.100' },
        ],
        description: 'Associated forensic entities mentioned or involved in this event',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTimelineEventDto.prototype, "entities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Arbitrary context attributes (e.g. line numbers, offsets, hashes)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTimelineEventDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-timeline-event.dto.js.map