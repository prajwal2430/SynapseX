"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
function setupSwagger(app) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('SynapseX Enterprise API')
        .setDescription('Enterprise REST API documentation for the SynapseX AI-Assisted Digital Evidence Intelligence Platform.\n\n' +
        'All protected endpoints require a JWT Bearer token in the `Authorization` header.')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
    }, 'JWT-auth')
        .addApiKey({
        type: 'apiKey',
        name: 'X-Internal-Service-Key',
        in: 'header',
        description: 'Internal service authentication key for inter-service communication',
    }, 'Internal-Service-Key')
        .addTag('Health', 'Platform liveness, readiness, and storage health probes')
        .addTag('Cases', 'Case lifecycle, case status, and investigator assignments')
        .addTag('Evidence', 'Evidence ingest, hash integrity, and MinIO object storage')
        .addTag('Chain of Custody', 'Tamper-evident chain of custody audit trail')
        .addTag('Intelligence & Agents', 'AI agent pipeline execution and forensic findings')
        .addTag('Timeline', 'Chronological event sequencing and temporal correlation')
        .addTag('Reports', 'Investigative dossier compilation and PDF export')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'SynapseX API Docs',
    });
}
//# sourceMappingURL=swagger.config.js.map