import { CustodyAction } from '../enums/custody-action.enum';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';
export declare enum ChainVerificationStatus {
    VERIFIED = "VERIFIED",
    BROKEN_CHAIN = "BROKEN_CHAIN",
    MISSING_RECORD = "MISSING_RECORD",
    TAMPERED_RECORD = "TAMPERED_RECORD",
    EMPTY_CHAIN = "EMPTY_CHAIN"
}
export declare class ChainOfCustodyResponseDto {
    id: string;
    evidenceId: string;
    caseId: string;
    action: CustodyAction;
    actorId: string | UserProfileDto;
    timestamp: string;
    sequenceNumber: number;
    metadata: Record<string, any>;
    previousRecordHash: string;
    recordHash: string;
}
export declare class VerifyChainResponseDto {
    isValid: boolean;
    status: ChainVerificationStatus;
    totalRecords: number;
    chainHeadHash: string | null;
    verifiedAt: string;
    message: string;
    details?: Record<string, any>;
    disclaimer: string;
}
