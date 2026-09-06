import {
  AiEvidenceAnalysisRequestDto,
  AiEvidenceAnalysisResponseDto,
  AiTimelineAnalysisRequestDto,
  AiTimelineAnalysisResponseDto,
  AiCorrelationAnalysisRequestDto,
  AiCorrelationAnalysisResponseDto,
} from '../dto/ai-analysis.dto';

export const AI_SERVICE_CLIENT = 'AI_SERVICE_CLIENT';

export interface IAiServiceClient {
  /**
   * Analyzes an evidence artifact extracting deterministic forensic entities.
   */
  analyzeEvidence(
    request: AiEvidenceAnalysisRequestDto,
  ): Promise<AiEvidenceAnalysisResponseDto>;

  /**
   * Reconstructs, normalizes to UTC, and clusters timeline events.
   */
  analyzeTimeline(
    request: AiTimelineAnalysisRequestDto,
  ): Promise<AiTimelineAnalysisResponseDto>;

  /**
   * Executes multi-signal correlation across evidence and raw events.
   */
  analyzeCorrelation(
    request: AiCorrelationAnalysisRequestDto,
  ): Promise<AiCorrelationAnalysisResponseDto>;

  /**
   * Checks connectivity and operational status of the internal AI service.
   */
  checkHealth(): Promise<boolean>;
}
