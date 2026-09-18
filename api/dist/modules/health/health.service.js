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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
let HealthService = class HealthService {
    constructor(connection, configService) {
        this.connection = connection;
        this.configService = configService;
    }
    getDatabaseStatus() {
        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };
        const readyState = this.connection?.readyState ?? 0;
        return stateMap[readyState] || 'unknown';
    }
    getHealth() {
        const dbStatus = this.getDatabaseStatus();
        const serviceName = this.configService.get('app.name', 'synapsex-api');
        const version = this.configService.get('app.version', '1.0.0');
        const isHealthy = dbStatus === 'connected' || dbStatus === 'connecting';
        return {
            status: isHealthy ? 'ok' : 'degraded',
            service: {
                name: serviceName,
                status: 'operational',
                uptime: process.uptime(),
            },
            database: {
                status: dbStatus,
                type: 'mongodb',
            },
            timestamp: new Date().toISOString(),
            version,
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Connection,
        config_1.ConfigService])
], HealthService);
//# sourceMappingURL=health.service.js.map