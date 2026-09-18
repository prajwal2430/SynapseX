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
var FastApiAiServiceClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastApiAiServiceClient = exports.AiServiceUnavailableException = exports.AiServiceTimeoutException = exports.AiServiceException = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
class AiServiceException extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AiServiceException';
    }
}
exports.AiServiceException = AiServiceException;
class AiServiceTimeoutException extends AiServiceException {
    constructor(message = 'AI Service request timed out') {
        super(message, 408);
        this.name = 'AiServiceTimeoutException';
    }
}
exports.AiServiceTimeoutException = AiServiceTimeoutException;
class AiServiceUnavailableException extends AiServiceException {
    constructor(message = 'AI Service is unavailable or unreachable') {
        super(message, 503);
        this.name = 'AiServiceUnavailableException';
    }
}
exports.AiServiceUnavailableException = AiServiceUnavailableException;
let FastApiAiServiceClient = FastApiAiServiceClient_1 = class FastApiAiServiceClient {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FastApiAiServiceClient_1.name);
        const rawUrl = this.configService.get('services.aiService.url') ||
            process.env.AI_SERVICE_URL ||
            'http://localhost:8000';
        this.baseUrl = rawUrl.replace(/\/+$/, '');
        this.apiKey = this.configService.get('services.aiService.apiKey') ||
            process.env.AI_SERVICE_API_KEY ||
            process.env.INTERNAL_SERVICE_KEY ||
            'synapsex-internal-secret-dev-key';
        this.timeoutMs = this.configService.get('services.aiService.timeoutMs') || 15000;
    }
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Internal-Service-Key': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
        };
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers,
                },
            });
            if (!response.ok) {
                let errorBody;
                try {
                    errorBody = await response.json();
                }
                catch {
                    errorBody = await response.text();
                }
                this.logger.error(`[AiServiceClient] HTTP ${response.status} from ${endpoint}: ${JSON.stringify(errorBody)}`);
                throw new AiServiceException(`AI Service returned HTTP ${response.status} on ${endpoint}`, response.status, errorBody);
            }
            return (await response.json());
        }
        catch (error) {
            if (error instanceof AiServiceException) {
                throw error;
            }
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                this.logger.error(`[AiServiceClient] Request timed out after ${this.timeoutMs}ms: ${url}`);
                throw new AiServiceTimeoutException(`Request to AI Service at ${endpoint} timed out`);
            }
            this.logger.error(`[AiServiceClient] Network or connection error contacting ${url}: ${error.message}`);
            throw new AiServiceUnavailableException(`Failed to communicate with AI Service: ${error.message}`);
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async analyzeEvidence(request) {
        const payload = {
            case_id: request.caseId,
            evidence_id: request.evidenceId,
            file_name: request.fileName,
            mime_type: request.mimeType || 'application/octet-stream',
            file_size: request.fileSize,
            sha256: request.sha256,
            metadata: request.metadata || {},
            content_text: request.contentText,
            raw_events: request.rawEvents || [],
        };
        this.logger.log(`[AiServiceClient] Dispatching evidence analysis for evidence ${request.evidenceId} (case ${request.caseId})`);
        const rawResponse = await this.request('/internal/analyze/evidence', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const entities = (rawResponse.entities || []).map((e) => ({
            entityType: e.entity_type,
            entityValue: e.entity_value,
            normalizedValue: e.normalized_value,
            confidence: typeof e.confidence === 'number' ? e.confidence : 1.0,
            evidenceId: e.evidence_id || request.evidenceId,
            eventId: e.event_id,
            context: e.context,
        }));
        return {
            caseId: rawResponse.case_id || request.caseId,
            evidenceId: rawResponse.evidence_id || request.evidenceId,
            fileName: rawResponse.file_name || request.fileName,
            entities,
            entityCounts: rawResponse.entity_counts || {},
            totalEntities: typeof rawResponse.total_entities === 'number' ? rawResponse.total_entities : entities.length,
            executionTimeMs: rawResponse.execution_time_ms || 0,
        };
    }
    async analyzeTimeline(request) {
        const payload = {
            case_id: request.caseId,
            events: request.events,
            window_seconds: request.windowSeconds || 300,
        };
        const rawResponse = await this.request('/internal/analyze/timeline', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return {
            caseId: rawResponse.case_id,
            timeline: (rawResponse.timeline || []).map((t) => ({
                eventId: t.event_id,
                evidenceId: t.evidence_id,
                timestamp: t.timestamp,
                source: t.source,
                eventType: t.event_type || 'event',
                description: t.description || '',
                entities: (t.entities || []).map((e) => ({
                    entityType: e.entity_type,
                    entityValue: e.entity_value,
                    normalizedValue: e.normalized_value,
                    confidence: e.confidence || 1.0,
                })),
            })),
            clusters: rawResponse.clusters || [],
            totalEvents: rawResponse.total_events || 0,
            temporalRange: rawResponse.temporal_range || {},
            executionTimeMs: rawResponse.execution_time_ms || 0,
        };
    }
    async analyzeCorrelation(request) {
        const payload = {
            case_id: request.caseId,
            extracted_entities: (request.extractedEntities || []).map((e) => ({
                entity_type: e.entityType,
                entity_value: e.entityValue,
                normalized_value: e.normalizedValue,
                confidence: e.confidence,
                evidence_id: e.evidenceId,
                event_id: e.eventId,
            })),
            timeline: request.timeline || [],
            raw_events: request.rawEvents || [],
        };
        const rawResponse = await this.request('/internal/analyze/correlation', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return {
            caseId: rawResponse.case_id,
            correlations: rawResponse.correlations || [],
            totalCorrelations: rawResponse.total_correlations || 0,
            highConfidenceCount: rawResponse.high_confidence_count || 0,
            disclaimer: rawResponse.disclaimer || '',
            executionTimeMs: rawResponse.execution_time_ms || 0,
        };
    }
    async checkHealth() {
        try {
            const result = await this.request('/health', { method: 'GET' });
            return result?.status === 'healthy';
        }
        catch (err) {
            this.logger.warn(`AI service health check failed: ${err.message}`);
            return false;
        }
    }
};
exports.FastApiAiServiceClient = FastApiAiServiceClient;
exports.FastApiAiServiceClient = FastApiAiServiceClient = FastApiAiServiceClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FastApiAiServiceClient);
//# sourceMappingURL=fastapi-ai-service.client.js.map