import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiServiceClient } from '../interfaces/ai-service-client.interface';
import {
  AiEvidenceAnalysisRequestDto,
  AiEvidenceAnalysisResponseDto,
  AiTimelineAnalysisRequestDto,
  AiTimelineAnalysisResponseDto,
  AiCorrelationAnalysisRequestDto,
  AiCorrelationAnalysisResponseDto,
  ExtractedEntityDto,
} from '../dto/ai-analysis.dto';

export class AiServiceException extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'AiServiceException';
  }
}

export class AiServiceTimeoutException extends AiServiceException {
  constructor(message = 'AI Service request timed out') {
    super(message, 408);
    this.name = 'AiServiceTimeoutException';
  }
}

export class AiServiceUnavailableException extends AiServiceException {
  constructor(message = 'AI Service is unavailable or unreachable') {
    super(message, 503);
    this.name = 'AiServiceUnavailableException';
  }
}

@Injectable()
export class FastApiAiServiceClient implements IAiServiceClient {
  private readonly logger = new Logger(FastApiAiServiceClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const rawUrl = this.configService.get<string>('services.aiService.url') ||
      process.env.AI_SERVICE_URL ||
      'http://localhost:8000';
    this.baseUrl = rawUrl.replace(/\/+$/, '');

    this.apiKey = this.configService.get<string>('services.aiService.apiKey') ||
      process.env.AI_SERVICE_API_KEY ||
      process.env.INTERNAL_SERVICE_KEY ||
      'synapsex-internal-secret-dev-key';

    this.timeoutMs = this.configService.get<number>('services.aiService.timeoutMs') || 15000;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Internal-Service-Key': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getHeaders(),
          ...(options.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }

        this.logger.error(
          `[AiServiceClient] HTTP ${response.status} from ${endpoint}: ${JSON.stringify(errorBody)}`,
        );

        throw new AiServiceException(
          `AI Service returned HTTP ${response.status} on ${endpoint}`,
          response.status,
          errorBody,
        );
      }

      return (await response.json()) as T;
    } catch (error: any) {
      if (error instanceof AiServiceException) {
        throw error;
      }

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        this.logger.error(`[AiServiceClient] Request timed out after ${this.timeoutMs}ms: ${url}`);
        throw new AiServiceTimeoutException(`Request to AI Service at ${endpoint} timed out`);
      }

      this.logger.error(`[AiServiceClient] Network or connection error contacting ${url}: ${error.message}`);
      throw new AiServiceUnavailableException(`Failed to communicate with AI Service: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async analyzeEvidence(
    request: AiEvidenceAnalysisRequestDto,
  ): Promise<AiEvidenceAnalysisResponseDto> {
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

    this.logger.log(
      `[AiServiceClient] Dispatching evidence analysis for evidence ${request.evidenceId} (case ${request.caseId})`,
    );

    const rawResponse = await this.request<any>('/internal/analyze/evidence', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const entities: ExtractedEntityDto[] = (rawResponse.entities || []).map((e: any) => ({
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

  async analyzeTimeline(
    request: AiTimelineAnalysisRequestDto,
  ): Promise<AiTimelineAnalysisResponseDto> {
    const payload = {
      case_id: request.caseId,
      events: request.events,
      window_seconds: request.windowSeconds || 300,
    };

    const rawResponse = await this.request<any>('/internal/analyze/timeline', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      caseId: rawResponse.case_id,
      timeline: (rawResponse.timeline || []).map((t: any) => ({
        eventId: t.event_id,
        evidenceId: t.evidence_id,
        timestamp: t.timestamp,
        source: t.source,
        eventType: t.event_type || 'event',
        description: t.description || '',
        entities: (t.entities || []).map((e: any) => ({
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

  async analyzeCorrelation(
    request: AiCorrelationAnalysisRequestDto,
  ): Promise<AiCorrelationAnalysisResponseDto> {
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

    const rawResponse = await this.request<any>('/internal/analyze/correlation', {
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

  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.request<any>('/health', { method: 'GET' });
      return result?.status === 'healthy';
    } catch (err) {
      this.logger.warn(`AI service health check failed: ${err.message}`);
      return false;
    }
  }
}
