import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { Readable } from 'stream';
import { EvidenceDocument } from './schemas/evidence.schema';
import { CustodyLogDocument } from './schemas/custody-log.schema';
import { AnalysisResultDocument } from './schemas/analysis-result.schema';
import { CaseDocument } from '../cases/schemas/case.schema';
import { IEvidenceStorageService } from './storage/evidence-storage.interface';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { EvidenceResponseDto, CustodyLogResponseDto, VerifyHashResponseDto } from './dto/evidence-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { ConfigService } from '@nestjs/config';
export declare const EVIDENCE_QUEUE_NAME = "evidence-processing";
export interface EvidenceDownloadStreamResult {
    stream: Readable;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
}
export declare class EvidenceService {
    private readonly evidenceModel;
    private readonly custodyLogModel;
    private readonly caseModel;
    private readonly storageService;
    private readonly configService;
    private readonly analysisResultModel?;
    private readonly evidenceQueue?;
    private readonly logger;
    private readonly bucketName;
    constructor(evidenceModel: Model<EvidenceDocument>, custodyLogModel: Model<CustodyLogDocument>, caseModel: Model<CaseDocument>, storageService: IEvidenceStorageService, configService: ConfigService, analysisResultModel?: Model<AnalysisResultDocument>, evidenceQueue?: Queue);
    uploadAndIngest(file: Express.Multer.File, caseId: string, dto: UploadEvidenceDto, currentUser: UserProfileDto, reqContext?: {
        ip?: string;
        userAgent?: string;
    }): Promise<EvidenceResponseDto>;
    findByCaseId(caseId: string, currentUser: UserProfileDto): Promise<EvidenceResponseDto[]>;
    findById(id: string, currentUser: UserProfileDto): Promise<EvidenceResponseDto>;
    deleteEvidence(id: string, currentUser: UserProfileDto, reqContext?: {
        ip?: string;
        userAgent?: string;
    }): Promise<{
        success: boolean;
        message: string;
        evidenceId: string;
    }>;
    getDownloadStream(id: string, currentUser: UserProfileDto, reqContext?: {
        ip?: string;
        userAgent?: string;
    }): Promise<EvidenceDownloadStreamResult>;
    getSecureDownloadUrl(id: string, currentUser: UserProfileDto, expiresInSeconds?: number, reqContext?: {
        ip?: string;
        userAgent?: string;
    }): Promise<{
        downloadUrl: string;
        expiresInSeconds: number;
    }>;
    getCustodyChain(evidenceId: string, currentUser: UserProfileDto): Promise<CustodyLogResponseDto[]>;
    verifyIntegrity(evidenceId: string, currentUser: UserProfileDto, reqContext?: {
        ip?: string;
        userAgent?: string;
    }): Promise<VerifyHashResponseDto>;
    assertCanManageCase(caseDoc: CaseDocument, currentUser: UserProfileDto): void;
    assertCanViewCase(caseDoc: CaseDocument, currentUser: UserProfileDto): void;
    private generateEvidenceNumber;
    private mapToEvidenceResponse;
    private mapToCustodyResponse;
    getAnalysisResult(evidenceId: string, currentUser: UserProfileDto): Promise<any>;
}
