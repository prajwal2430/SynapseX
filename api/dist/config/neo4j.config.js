"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.neo4jConfig = void 0;
const config_1 = require("@nestjs/config");
exports.neo4jConfig = (0, config_1.registerAs)('neo4j', () => ({
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'synapsex_neo4j_password',
    database: process.env.NEO4J_DATABASE || 'neo4j',
}));
//# sourceMappingURL=neo4j.config.js.map