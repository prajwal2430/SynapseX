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
exports.HealthResponseDto = exports.DatabaseStatusDto = exports.ServiceStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ServiceStatusDto {
}
exports.ServiceStatusDto = ServiceStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'synapsex-api' }),
    __metadata("design:type", String)
], ServiceStatusDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'operational' }),
    __metadata("design:type", String)
], ServiceStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42.5 }),
    __metadata("design:type", Number)
], ServiceStatusDto.prototype, "uptime", void 0);
class DatabaseStatusDto {
}
exports.DatabaseStatusDto = DatabaseStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'connected', enum: ['connected', 'connecting', 'disconnected', 'disconnecting'] }),
    __metadata("design:type", String)
], DatabaseStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mongodb' }),
    __metadata("design:type", String)
], DatabaseStatusDto.prototype, "type", void 0);
class HealthResponseDto {
}
exports.HealthResponseDto = HealthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ok' }),
    __metadata("design:type", String)
], HealthResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ServiceStatusDto }),
    __metadata("design:type", ServiceStatusDto)
], HealthResponseDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: DatabaseStatusDto }),
    __metadata("design:type", DatabaseStatusDto)
], HealthResponseDto.prototype, "database", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-06T01:05:00.000Z' }),
    __metadata("design:type", String)
], HealthResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1.0.0' }),
    __metadata("design:type", String)
], HealthResponseDto.prototype, "version", void 0);
//# sourceMappingURL=health-response.dto.js.map