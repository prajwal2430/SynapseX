import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChainOfCustody,
  ChainOfCustodyDocument,
  GENESIS_HASH,
} from './schemas/chain-of-custody.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';
import { Evidence, EvidenceDocument } from '../evidence/schemas/evidence.schema';
import { CustodyAction } from './enums/custody-action.enum';
import {
  ChainOfCustodyResponseDto,
  VerifyChainResponseDto,
  ChainVerificationStatus,
} from './dto/chain-of-custody-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { computeCustodyRecordHash } from './utils/custody-hash.util';

export interface AppendCustodyRecordInput {
  evidenceId: string | Types.ObjectId;
  caseId: string | Types.ObjectId;
  action: CustodyAction;
  actorId: string | Types.ObjectId;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export const CUSTODY_LEGAL_DISCLAIMER =
  'Notice: SynapseX tamper-evident custody logging provides mathematical audit integrity and cryptographic non-repudiation within the platform. It does not constitute legal or court certification.';

@Injectable()
export class CustodyService {
  private readonly logger = new Logger(CustodyService.name);

  constructor(
    @InjectModel(ChainOfCustody.name)
    private readonly custodyModel: Model<ChainOfCustodyDocument>,
    @InjectModel(Evidence.name)
    private readonly evidenceModel: Model<EvidenceDocument>,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
  ) {}

  /**
   * Appends an immutable, cryptographically chained custody block to the evidence ledger.
   * References the hash of the preceding record (or GENESIS for record 1).
   */
  async appendRecord(input: AppendCustodyRecordInput): Promise<ChainOfCustodyDocument> {
    const evidenceObjectId = new Types.ObjectId(input.evidenceId.toString());
    const caseObjectId = new Types.ObjectId(input.caseId.toString());
    const actorObjectId = new Types.ObjectId(input.actorId.toString());
    const timestamp = input.timestamp || new Date();

    // Retrieve the current head of the chain for this evidence item
    const latestRecord = await this.custodyModel
      .findOne({ evidenceId: evidenceObjectId })
      .sort({ sequenceNumber: -1 })
      .exec();

    let sequenceNumber = 1;
    let previousRecordHash = GENESIS_HASH;

    if (latestRecord) {
      sequenceNumber = latestRecord.sequenceNumber + 1;
      previousRecordHash = latestRecord.recordHash;
    }

    const metadata = input.metadata || {};

    const recordHash = computeCustodyRecordHash({
      evidenceId: evidenceObjectId.toString(),
      caseId: caseObjectId.toString(),
      action: input.action,
      actorId: actorObjectId.toString(),
      timestamp,
      sequenceNumber,
      previousRecordHash,
      metadata,
    });

    const newRecord = new this.custodyModel({
      evidenceId: evidenceObjectId,
      caseId: caseObjectId,
      action: input.action,
      actorId: actorObjectId,
      timestamp,
      sequenceNumber,
      metadata,
      previousRecordHash,
      recordHash,
    });

    const savedRecord = await newRecord.save();

    this.logger.log(
      `[Tamper-Evident Custody] Appended block seq #${sequenceNumber} (${input.action}) for evidence '${evidenceObjectId}' - Hash: ${recordHash.substring(0, 16)}...`,
    );

    return savedRecord;
  }

  /**
   * Retrieves all custody blocks for a specific evidence item.
   * Enforces case authorization.
   */
  async getChainByEvidenceId(
    evidenceId: string,
    currentUser: UserProfileDto,
  ): Promise<ChainOfCustodyResponseDto[]> {
    await this.assertCaseAccessForEvidence(evidenceId, currentUser);

    const records = await this.custodyModel
      .find({ evidenceId: new Types.ObjectId(evidenceId) })
      .sort({ sequenceNumber: 1 })
      .populate('actorId', 'name email role')
      .exec();

    return records.map((record) => this.mapToResponse(record));
  }

  /**
   * Verifies the cryptographic integrity of the entire custody chain for an evidence artifact.
   * Checks:
   * 1. Genesis record authenticity
   * 2. Continuity of previousRecordHash pointers (broken chain detection)
   * 3. Sequence number continuity (missing record detection)
   * 4. Cryptographic re-computation of each record's SHA-256 hash (tampered record detection)
   */
  async verifyChain(
    evidenceId: string,
    currentUser: UserProfileDto,
  ): Promise<VerifyChainResponseDto> {
    await this.assertCaseAccessForEvidence(evidenceId, currentUser);

    const records = await this.custodyModel
      .find({ evidenceId: new Types.ObjectId(evidenceId) })
      .sort({ sequenceNumber: 1 })
      .exec();

    const verifiedAt = new Date().toISOString();

    if (!records || records.length === 0) {
      return {
        isValid: true,
        status: ChainVerificationStatus.EMPTY_CHAIN,
        totalRecords: 0,
        chainHeadHash: null,
        verifiedAt,
        message: 'No custody records found for this evidence artifact.',
        disclaimer: CUSTODY_LEGAL_DISCLAIMER,
      };
    }

    // Step-by-step verification of the cryptographic chain
    for (let i = 0; i < records.length; i++) {
      const current = records[i];

      // 1. Genesis block verification
      if (i === 0) {
        if (current.sequenceNumber !== 1) {
          return {
            isValid: false,
            status: ChainVerificationStatus.MISSING_RECORD,
            totalRecords: records.length,
            chainHeadHash: records[records.length - 1].recordHash,
            verifiedAt,
            message: `Missing initial record: Genesis block sequence is ${current.sequenceNumber}, expected 1.`,
            details: {
              brokenRecordId: current._id.toString(),
              sequenceNumber: current.sequenceNumber,
              expectedSequence: 1,
            },
            disclaimer: CUSTODY_LEGAL_DISCLAIMER,
          };
        }

        if (current.previousRecordHash !== GENESIS_HASH) {
          return {
            isValid: false,
            status: ChainVerificationStatus.BROKEN_CHAIN,
            totalRecords: records.length,
            chainHeadHash: records[records.length - 1].recordHash,
            verifiedAt,
            message: `Genesis record does not reference ${GENESIS_HASH}.`,
            details: {
              brokenRecordId: current._id.toString(),
              sequenceNumber: 1,
              actualPreviousHash: current.previousRecordHash,
            },
            disclaimer: CUSTODY_LEGAL_DISCLAIMER,
          };
        }
      }

      // 2. Missing record check (sequence continuity)
      if (i > 0) {
        const previous = records[i - 1];
        if (current.sequenceNumber !== previous.sequenceNumber + 1) {
          return {
            isValid: false,
            status: ChainVerificationStatus.MISSING_RECORD,
            totalRecords: records.length,
            chainHeadHash: records[records.length - 1].recordHash,
            verifiedAt,
            message: `Missing record in custody chain: sequence jumped from #${previous.sequenceNumber} to #${current.sequenceNumber}.`,
            details: {
              precedingSequence: previous.sequenceNumber,
              encounteredSequence: current.sequenceNumber,
              expectedSequence: previous.sequenceNumber + 1,
            },
            disclaimer: CUSTODY_LEGAL_DISCLAIMER,
          };
        }

        // 3. Broken chain check (pointer continuity)
        if (current.previousRecordHash !== previous.recordHash) {
          return {
            isValid: false,
            status: ChainVerificationStatus.BROKEN_CHAIN,
            totalRecords: records.length,
            chainHeadHash: records[records.length - 1].recordHash,
            verifiedAt,
            message: `Broken chain pointer at sequence #${current.sequenceNumber}: previousRecordHash does not match record #${previous.sequenceNumber} hash.`,
            details: {
              sequenceNumber: current.sequenceNumber,
              expectedPreviousHash: previous.recordHash,
              actualPreviousHash: current.previousRecordHash,
            },
            disclaimer: CUSTODY_LEGAL_DISCLAIMER,
          };
        }
      }

      // 4. Tamper check (recompute SHA-256 hash)
      const recomputedHash = computeCustodyRecordHash({
        evidenceId: current.evidenceId.toString(),
        caseId: current.caseId.toString(),
        action: current.action,
        actorId: current.actorId.toString(),
        timestamp: current.timestamp,
        sequenceNumber: current.sequenceNumber,
        previousRecordHash: current.previousRecordHash,
        metadata: current.metadata,
      });

      if (recomputedHash !== current.recordHash) {
        return {
          isValid: false,
          status: ChainVerificationStatus.TAMPERED_RECORD,
          totalRecords: records.length,
          chainHeadHash: records[records.length - 1].recordHash,
          verifiedAt,
          message: `Tamper detected in record sequence #${current.sequenceNumber}: computed SHA-256 hash does not match stored hash.`,
          details: {
            sequenceNumber: current.sequenceNumber,
            storedHash: current.recordHash,
            recomputedHash,
          },
          disclaimer: CUSTODY_LEGAL_DISCLAIMER,
        };
      }
    }

    const headHash = records[records.length - 1].recordHash;

    return {
      isValid: true,
      status: ChainVerificationStatus.VERIFIED,
      totalRecords: records.length,
      chainHeadHash: headHash,
      verifiedAt,
      message:
        'Tamper-evident custody verification passed: All custody blocks and cryptographic hash pointers are intact and unaltered.',
      disclaimer: CUSTODY_LEGAL_DISCLAIMER,
    };
  }

  private async assertCaseAccessForEvidence(
    evidenceId: string,
    currentUser: UserProfileDto,
  ): Promise<{ evidence: EvidenceDocument; caseDoc: CaseDocument }> {
    const evidenceDoc = await this.evidenceModel
      .findOne({ _id: evidenceId, isDeleted: false })
      .exec();

    if (!evidenceDoc) {
      throw new NotFoundException(`Evidence artifact '${evidenceId}' not found`);
    }

    const caseDoc = await this.caseModel
      .findOne({ _id: evidenceDoc.caseId, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Associated case for evidence '${evidenceId}' not found`);
    }

    if (currentUser.role === Role.ADMIN) {
      return { evidence: evidenceDoc, caseDoc };
    }

    const isCreator = caseDoc.createdBy.toString() === currentUser.id;
    const isAssigned = caseDoc.assignedUsers.some(
      (userId) => userId.toString() === currentUser.id,
    );

    if (isCreator || isAssigned) {
      return { evidence: evidenceDoc, caseDoc };
    }

    throw new ForbiddenException(
      'Access denied: You are not authorized to view the chain of custody for this case',
    );
  }

  private mapToResponse(doc: any): ChainOfCustodyResponseDto {
    return {
      id: doc._id.toString(),
      evidenceId: doc.evidenceId?.toString?.() || doc.evidenceId,
      caseId: doc.caseId?.toString?.() || doc.caseId,
      action: doc.action,
      actorId: doc.actorId,
      timestamp: doc.timestamp?.toISOString?.() || new Date(doc.timestamp).toISOString(),
      sequenceNumber: doc.sequenceNumber,
      metadata: doc.metadata || {},
      previousRecordHash: doc.previousRecordHash,
      recordHash: doc.recordHash,
    };
  }
}
