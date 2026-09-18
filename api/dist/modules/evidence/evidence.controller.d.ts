import { Response } from 'express';
import { EvidenceService } from './evidence.service';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { EvidenceResponseDto, VerifyHashResponseDto } from './dto/evidence-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
export declare class EvidenceController {
    private readonly evidenceService;
    constructor(evidenceService: EvidenceService);
    uploadEvidence(caseId: string, file: Express.Multer.File, dto: UploadEvidenceDto, currentUser: UserProfileDto, ipAddress: string, userAgent?: string): Promise<EvidenceResponseDto>;
    getCaseEvidence(caseId: string, currentUser: UserProfileDto): Promise<EvidenceResponseDto[]>;
    getEvidenceById(id: string, currentUser: UserProfileDto): Promise<EvidenceResponseDto>;
    deleteEvidence(id: string, currentUser: UserProfileDto, ipAddress: string, userAgent?: string): Promise<{
        success: boolean;
        message: string;
        evidenceId: string;
    }>;
    downloadEvidence(id: string, currentUser: UserProfileDto, ipAddress: string, userAgent: string | undefined, res: Response): Promise<void>;
    getSecureDownloadUrl(id: string, currentUser: UserProfileDto, ipAddress: string, userAgent?: string): Promise<{
        downloadUrl: string;
        expiresInSeconds: number;
    }>;
    verifyIntegrity(id: string, currentUser: UserProfileDto, ipAddress: string, userAgent?: string): Promise<VerifyHashResponseDto>;
    getAnalysis(id: string, currentUser: UserProfileDto): Promise<any>;
}
