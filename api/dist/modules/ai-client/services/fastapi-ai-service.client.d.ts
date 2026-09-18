import { ConfigService } from '@nestjs/config';
import { IAiServiceClient } from '../interfaces/ai-service-client.interface';
import { AiEvidenceAnalysisRequestDto, AiEvidenceAnalysisResponseDto, AiTimelineAnalysisRequestDto, AiTimelineAnalysisResponseDto, AiCorrelationAnalysisRequestDto, AiCorrelationAnalysisResponseDto } from '../dto/ai-analysis.dto';
export declare class AiServiceException extends Error {
    readonly statusCode?: number;
    readonly details?: any;
    constructor(message: string, statusCode?: number, details?: any);
}
export declare class AiServiceTimeoutException extends AiServiceException {
    constructor(message?: string);
}
export declare class AiServiceUnavailableException extends AiServiceException {
    constructor(message?: string);
}
export declare class FastApiAiServiceClient implements IAiServiceClient {
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    private readonly timeoutMs;
    constructor(configService: ConfigService);
    private getHeaders;
    private request;
    analyzeEvidence(request: AiEvidenceAnalysisRequestDto): Promise<AiEvidenceAnalysisResponseDto>;
    analyzeTimeline(request: AiTimelineAnalysisRequestDto): Promise<AiTimelineAnalysisResponseDto>;
    analyzeCorrelation(request: AiCorrelationAnalysisRequestDto): Promise<AiCorrelationAnalysisResponseDto>;
    checkHealth(): Promise<boolean>;
}
