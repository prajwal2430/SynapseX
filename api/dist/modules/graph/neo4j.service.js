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
var Neo4jService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const neo4j_driver_1 = require("neo4j-driver");
let Neo4jService = Neo4jService_1 = class Neo4jService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(Neo4jService_1.name);
        this.driver = null;
        this.isConnected = false;
        this.defaultDatabase =
            this.configService.get('neo4j.database') || 'neo4j';
    }
    async onModuleInit() {
        const uri = this.configService.get('neo4j.uri');
        const username = this.configService.get('neo4j.username');
        const password = this.configService.get('neo4j.password');
        if (!uri || !username || !password) {
            this.logger.warn('Neo4j credentials or URI not fully configured. Graph service will operate in offline/degraded mode.');
            return;
        }
        try {
            this.driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.auth.basic(username, password), {
                disableLosslessIntegers: true,
            });
            await this.driver.verifyConnectivity();
            this.isConnected = true;
            this.logger.log(`Connected to Neo4j database at ${uri}`);
        }
        catch (error) {
            this.isConnected = false;
            this.logger.warn(`Failed to connect to Neo4j at ${uri}: ${error?.message || error}. Graph operations will be skipped or return empty results until connection is restored.`);
        }
    }
    async onModuleDestroy() {
        if (this.driver) {
            try {
                await this.driver.close();
                this.logger.log('Closed Neo4j driver connection.');
            }
            catch (error) {
                this.logger.error(`Error closing Neo4j driver: ${error?.message || error}`);
            }
        }
    }
    isAvailable() {
        return this.isConnected && this.driver !== null;
    }
    getDriver() {
        return this.driver;
    }
    async executeRead(cypher, params = {}, database) {
        if (!this.driver || !this.isConnected) {
            this.logger.warn('executeRead invoked while Neo4j is not connected.');
            return [];
        }
        const session = this.driver.session({
            database: database || this.defaultDatabase,
            defaultAccessMode: neo4j_driver_1.default.session.READ,
        });
        try {
            const result = await session.executeRead((tx) => tx.run(cypher, params));
            return result.records;
        }
        catch (error) {
            this.logger.error(`Cypher read error: ${error?.message || error}`, error?.stack);
            throw error;
        }
        finally {
            await session.close();
        }
    }
    async executeWrite(cypher, params = {}, database) {
        if (!this.driver || !this.isConnected) {
            this.logger.warn('executeWrite invoked while Neo4j is not connected.');
            return [];
        }
        const session = this.driver.session({
            database: database || this.defaultDatabase,
            defaultAccessMode: neo4j_driver_1.default.session.WRITE,
        });
        try {
            const result = await session.executeWrite((tx) => tx.run(cypher, params));
            return result.records;
        }
        catch (error) {
            this.logger.error(`Cypher write error: ${error?.message || error}`, error?.stack);
            throw error;
        }
        finally {
            await session.close();
        }
    }
    async checkHealth() {
        if (!this.driver) {
            return { status: 'down', details: { message: 'Driver not initialized' } };
        }
        try {
            const serverInfo = await this.driver.getServerInfo();
            return {
                status: 'up',
                details: {
                    address: serverInfo.address,
                    agent: serverInfo.agent,
                    protocolVersion: serverInfo.protocolVersion,
                },
            };
        }
        catch (error) {
            return {
                status: 'down',
                details: { message: error?.message || 'Failed to verify connectivity' },
            };
        }
    }
};
exports.Neo4jService = Neo4jService;
exports.Neo4jService = Neo4jService = Neo4jService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Neo4jService);
//# sourceMappingURL=neo4j.service.js.map