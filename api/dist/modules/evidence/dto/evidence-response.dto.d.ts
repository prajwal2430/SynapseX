import { EvidenceStatus } from '../enums/evidence-status.enum';
import { ProcessingStatus } from '../enums/processing-status.enum';
import { IntegrityStatus } from '../enums/integrity-status.enum';
import { CustodyAction } from '../enums/custody-action.enum';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';
export declare class CustodyLogResponseDto {
    id: string;
    evidenceId: string;
    caseId: string;
    action: CustodyAction;
    performedBy: string | UserProfileDto;
    sha256AtAction: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}
export declare class EvidenceResponseDto {
    id: string;
    caseId: string;
    evidenceNumber: string;
    originalFilename: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    fileSizeBytes: number;
    sha256: string;
    uploadedBy: string | UserProfileDto;
    uploadedAt: string;
    processingStatus: ProcessingStatus;
    integrityStatus: IntegrityStatus;
    metadata: Record<string, any>;
    md5?: string;
    storageBucket: string;
    source: string;
    description: string;
    status: EvidenceStatus;
    tags: string[];
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    initialCustodyRecord?: CustodyLogResponseDto;
    queueJobId?: string;
}
export declare class VerifyHashResponseDto {
    evidenceNumber: string;
    verified: boolean;
    recordedHash: string;
    computedHash: string;
    message: string;
    custodyLog: CustodyLogResponseDto;
}
