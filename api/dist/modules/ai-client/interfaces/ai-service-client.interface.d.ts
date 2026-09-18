import { AiEvidenceAnalysisRequestDto, AiEvidenceAnalysisResponseDto, AiTimelineAnalysisRequestDto, AiTimelineAnalysisResponseDto, AiCorrelationAnalysisRequestDto, AiCorrelationAnalysisResponseDto } from '../dto/ai-analysis.dto';
export declare const AI_SERVICE_CLIENT = "AI_SERVICE_CLIENT";
export interface IAiServiceClient {
    analyzeEvidence(request: AiEvidenceAnalysisRequestDto): Promise<AiEvidenceAnalysisResponseDto>;
    analyzeTimeline(request: AiTimelineAnalysisRequestDto): Promise<AiTimelineAnalysisResponseDto>;
    analyzeCorrelation(request: AiCorrelationAnalysisRequestDto): Promise<AiCorrelationAnalysisResponseDto>;
    checkHealth(): Promise<boolean>;
}
