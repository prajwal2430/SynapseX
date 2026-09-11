import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Finding, FindingDocument } from './schemas/finding.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';
import { AuditService } from '../audit/audit.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { ReviewFindingDto } from './dto/review-finding.dto';
import { FindingQueryDto } from './dto/finding-query.dto';
import { FindingResponseDto } from './dto/finding-response.dto';
import { ReviewStatus } from './enums/review-status.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { Optional } from '@nestjs/common';
import { RealtimeEventsService } from '../realtime/services/realtime-events.service';

@Injectable()
export class FindingsService {
  private readonly logger = new Logger(FindingsService.name);

  constructor(
    @InjectModel(Finding.name)
    private readonly findingModel: Model<FindingDocument>,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
    private readonly auditService: AuditService,
    @Optional()
    private readonly realtimeEventsService?: RealtimeEventsService,
  ) {}

  /**
   * Retrieves paginated, filtered, and searchable findings for a specific case.
   */
  async findByCaseId(
    caseId: string,
    query: FindingQueryDto,
    currentUser: UserProfileDto,
  ): Promise<PaginatedResult<FindingResponseDto>> {
    const caseDoc = await this.caseModel.findById(caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<FindingDocument> = {
      caseId: new Types.ObjectId(caseId),
    };

    if (query.reviewStatus) {
      filter.reviewStatus = query.reviewStatus;
    }

    if (query.findingType) {
      filter.findingType = query.findingType;
    }

    if (query.minConfidence !== undefined) {
      filter.confidenceScore = { $gte: query.minConfidence };
    }

    if (query.evidenceStrength) {
      filter.evidenceStrength = query.evidenceStrength;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { reasoning: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [items, total] = await Promise.all([
      this.findingModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.findingModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((doc) => this.mapToResponse(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a single finding by ID, verifying case access.
   */
  async findById(
    id: string,
    currentUser: UserProfileDto,
  ): Promise<FindingResponseDto> {
    const finding = await this.findingModel.findById(id).exec();
    if (!finding) {
      throw new NotFoundException(`Finding with ID '${id}' not found`);
    }

    const caseDoc = await this.caseModel.findById(finding.caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Associated case with ID '${finding.caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    return this.mapToResponse(finding);
  }

  /**
   * Approves an AI-generated finding.
   * Only callable by REVIEWER or ADMIN.
   * Records review decision in the immutable audit log.
   */
  async approveFinding(
    id: string,
    dto: ReviewFindingDto,
    currentUser: UserProfileDto,
    reqContext?: { ip?: string; userAgent?: string },
  ): Promise<FindingResponseDto> {
    const finding = await this.findingModel.findById(id).exec();
    if (!finding) {
      throw new NotFoundException(`Finding with ID '${id}' not found`);
    }

    const previousStatus = finding.reviewStatus;
    finding.reviewStatus = ReviewStatus.APPROVED;
    finding.reviewedBy = new Types.ObjectId(currentUser.id);
    finding.reviewedAt = new Date();
    finding.reviewComment = dto.comment?.trim() || '';

    const savedFinding = await finding.save();

    this.logger.log(
      `[FindingsService] Finding '${id}' APPROVED by ${currentUser.email} (${currentUser.role})`,
    );

    // Record decision in the audit log
    await this.auditService.log({
      userId: currentUser.id,
      action: 'FINDING_APPROVED',
      resourceType: 'Finding',
      resourceId: finding._id.toString(),
      ipAddress: reqContext?.ip,
      userAgent: reqContext?.userAgent,
      metadata: {
        caseId: finding.caseId.toString(),
        findingTitle: finding.title,
        findingType: finding.findingType,
        previousStatus,
        newStatus: ReviewStatus.APPROVED,
        reviewComment: finding.reviewComment,
      },
    });

    return this.mapToResponse(savedFinding);
  }

  /**
   * Rejects an AI-generated finding.
   * Only callable by REVIEWER or ADMIN.
   * Records review decision in the immutable audit log.
   */
  async rejectFinding(
    id: string,
    dto: ReviewFindingDto,
    currentUser: UserProfileDto,
    reqContext?: { ip?: string; userAgent?: string },
  ): Promise<FindingResponseDto> {
    const finding = await this.findingModel.findById(id).exec();
    if (!finding) {
      throw new NotFoundException(`Finding with ID '${id}' not found`);
    }

    const previousStatus = finding.reviewStatus;
    finding.reviewStatus = ReviewStatus.REJECTED;
    finding.reviewedBy = new Types.ObjectId(currentUser.id);
    finding.reviewedAt = new Date();
    finding.reviewComment = dto.comment?.trim() || '';

    const savedFinding = await finding.save();

    this.logger.log(
      `[FindingsService] Finding '${id}' REJECTED by ${currentUser.email} (${currentUser.role})`,
    );

    // Record decision in the audit log
    await this.auditService.log({
      userId: currentUser.id,
      action: 'FINDING_REJECTED',
      resourceType: 'Finding',
      resourceId: finding._id.toString(),
      ipAddress: reqContext?.ip,
      userAgent: reqContext?.userAgent,
      metadata: {
        caseId: finding.caseId.toString(),
        findingTitle: finding.title,
        findingType: finding.findingType,
        previousStatus,
        newStatus: ReviewStatus.REJECTED,
        reviewComment: finding.reviewComment,
      },
    });

    return this.mapToResponse(savedFinding);
  }

  /**
   * Creates an initial finding.
   * AI-generated findings must strictly default to PENDING_REVIEW.
   */
  async createFinding(dto: CreateFindingDto): Promise<FindingDocument> {
    const finding = new this.findingModel({
      caseId: new Types.ObjectId(dto.caseId),
      title: dto.title.trim(),
      description: dto.description.trim(),
      findingType: dto.findingType.trim(),
      confidenceScore: dto.confidenceScore,
      evidenceStrength: dto.evidenceStrength || 'MEDIUM',
      supportingEvidence: (dto.supportingEvidence || []).map((id) => new Types.ObjectId(id)),
      supportingEntities: (dto.supportingEntities || []).map((id) => new Types.ObjectId(id)),
      reasoning: dto.reasoning.trim(),
      limitations: dto.limitations?.trim() || '',
      generatedBy: dto.generatedBy || 'AI_SERVICE',
      reviewStatus: ReviewStatus.PENDING_REVIEW,
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: '',
    });

    const saved = await finding.save();

    this.realtimeEventsService?.emitFindingCreated(saved.caseId.toString(), {
      findingId: saved._id.toString(),
      title: saved.title,
      findingType: saved.findingType,
      confidenceScore: saved.confidenceScore,
      generatedBy: saved.generatedBy,
    });

    return saved;
  }

  public assertCanViewCase(
    caseDoc: CaseDocument,
    currentUser: UserProfileDto,
  ): void {
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    const isCreator = caseDoc.createdBy.toString() === currentUser.id;
    const isAssigned = caseDoc.assignedUsers.some(
      (userId) => userId.toString() === currentUser.id,
    );

    if (isCreator || isAssigned) {
      return;
    }

    throw new ForbiddenException(
      'Access denied: You are not authorized to view findings for this case',
    );
  }

  private mapToResponse(doc: FindingDocument): FindingResponseDto {
    return {
      id: doc._id.toString(),
      caseId: doc.caseId.toString(),
      title: doc.title,
      description: doc.description,
      findingType: doc.findingType,
      confidenceScore: doc.confidenceScore,
      evidenceStrength: doc.evidenceStrength,
      supportingEvidence: (doc.supportingEvidence || []).map((id) => id.toString()),
      supportingEntities: (doc.supportingEntities || []).map((id) => id.toString()),
      reasoning: doc.reasoning,
      limitations: doc.limitations || '',
      generatedBy: doc.generatedBy,
      reviewStatus: doc.reviewStatus,
      reviewedBy: doc.reviewedBy ? doc.reviewedBy.toString() : null,
      reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
      reviewComment: doc.reviewComment || '',
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  private escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }
}
