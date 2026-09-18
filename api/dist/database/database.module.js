"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const logger = new common_1.Logger('MongoDB');
                    const uri = configService.get('database.uri');
                    const options = configService.get('database.options');
                    return {
                        uri,
                        ...options,
                        connectionFactory: (connection) => {
                            connection.on('connected', () => {
                                logger.log('✅ MongoDB connection established successfully');
                            });
                            connection.on('disconnected', () => {
                                logger.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
                            });
                            connection.on('reconnected', () => {
                                logger.log('🔄 MongoDB reconnected successfully');
                            });
                            connection.on('error', (error) => {
                                logger.error(`❌ MongoDB connection error: ${error.message}`);
                            });
                            return connection;
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        exports: [mongoose_1.MongooseModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map