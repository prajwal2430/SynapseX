import { Model, Types } from 'mongoose';
import { ChainOfCustodyDocument } from './schemas/chain-of-custody.schema';
import { CaseDocument } from '../cases/schemas/case.schema';
import { EvidenceDocument } from '../evidence/schemas/evidence.schema';
import { CustodyAction } from './enums/custody-action.enum';
import { ChainOfCustodyResponseDto, VerifyChainResponseDto } from './dto/chain-of-custody-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
export interface AppendCustodyRecordInput {
    evidenceId: string | Types.ObjectId;
    caseId: string | Types.ObjectId;
    action: CustodyAction;
    actorId: string | Types.ObjectId;
    metadata?: Record<string, any>;
    timestamp?: Date;
}
export declare const CUSTODY_LEGAL_DISCLAIMER = "Notice: SynapseX tamper-evident custody logging provides mathematical audit integrity and cryptographic non-repudiation within the platform. It does not constitute legal or court certification.";
export declare class CustodyService {
    private readonly custodyModel;
    private readonly evidenceModel;
    private readonly caseModel;
    private readonly logger;
    constructor(custodyModel: Model<ChainOfCustodyDocument>, evidenceModel: Model<EvidenceDocument>, caseModel: Model<CaseDocument>);
    appendRecord(input: AppendCustodyRecordInput): Promise<ChainOfCustodyDocument>;
    getChainByEvidenceId(evidenceId: string, currentUser: UserProfileDto): Promise<ChainOfCustodyResponseDto[]>;
    verifyChain(evidenceId: string, currentUser: UserProfileDto): Promise<VerifyChainResponseDto>;
    private assertCaseAccessForEvidence;
    private mapToResponse;
}
