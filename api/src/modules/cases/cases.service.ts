import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Case, CaseDocument } from './schemas/case.schema';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseQueryDto } from './dto/case-query.dto';
import {
  CaseResponseDto,
  DeleteCaseResponseDto,
} from './dto/case-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    @InjectModel(Case.name) private readonly caseModel: Model<CaseDocument>,
  ) {}

  /**
   * Creates a new case with an auto-generated case number (CASE-YYYY-XXXX).
   * The creating investigator is automatically assigned to the case.
   */
  async create(
    createCaseDto: CreateCaseDto,
    creator: UserProfileDto,
  ): Promise<CaseResponseDto> {
    const caseNumber = await this.generateCaseNumber();

    const creatorId = new Types.ObjectId(creator.id);
    const assignedUserIds = (createCaseDto.assignedUsers || []).map(
      (id) => new Types.ObjectId(id),
    );

    // Ensure creator is included in assigned users
    const hasCreator = assignedUserIds.some((id) => id.equals(creatorId));
    if (!hasCreator) {
      assignedUserIds.push(creatorId);
    }

    const newCase = new this.caseModel({
      caseNumber,
      title: createCaseDto.title.trim(),
      description: createCaseDto.description.trim(),
      priority: createCaseDto.priority,
      tags: createCaseDto.tags || [],
      createdBy: creatorId,
      assignedUsers: assignedUserIds,
      isDeleted: false,
      deletedAt: null,
    });

    const savedCase = await newCase.save();
    this.logger.log(
      `New case created: ${savedCase.caseNumber} by ${creator.email} (ID: ${savedCase._id})`,
    );

    return this.mapToCaseResponse(savedCase);
  }

  /**
   * Retrieves paginated cases with full-text search, status/priority filtering, and sorting.
   */
  async findAll(
    query: CaseQueryDto,
  ): Promise<PaginatedResult<CaseResponseDto>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    // Full-text regex search on title, description, or caseNumber
    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { caseNumber: searchRegex },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.tag) {
      filter.tags = query.tag.trim();
    }

    if (query.assignedUser) {
      filter.assignedUsers = new Types.ObjectId(query.assignedUser);
    }

    // Build sorting
    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, any> = { [sortField]: sortDirection };

    const [cases, total] = await Promise.all([
      this.caseModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role')
        .populate('assignedUsers', 'name email role')
        .exec(),
      this.caseModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: cases.map((c) => this.mapToCaseResponse(c)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves a single case by its MongoDB ID.
   */
  async findById(id: string): Promise<CaseResponseDto> {
    const caseDoc = await this.caseModel
      .findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email role')
      .populate('assignedUsers', 'name email role')
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Case with ID '${id}' not found`);
    }

    return this.mapToCaseResponse(caseDoc);
  }

  /**
   * Updates an existing case.
   * Enforces role authorization: ADMIN can update any case; INVESTIGATOR can only update assigned cases.
   */
  async update(
    id: string,
    updateCaseDto: UpdateCaseDto,
    currentUser: UserProfileDto,
  ): Promise<CaseResponseDto> {
    const caseDoc = await this.caseModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Case with ID '${id}' not found`);
    }

    // Authorization check
    this.assertCanManageCase(caseDoc, currentUser);

    if (updateCaseDto.title) {
      caseDoc.title = updateCaseDto.title.trim();
    }
    if (updateCaseDto.description) {
      caseDoc.description = updateCaseDto.description.trim();
    }
    if (updateCaseDto.status) {
      caseDoc.status = updateCaseDto.status;
    }
    if (updateCaseDto.priority) {
      caseDoc.priority = updateCaseDto.priority;
    }
    if (updateCaseDto.tags) {
      caseDoc.tags = updateCaseDto.tags;
    }
    if (updateCaseDto.assignedUsers) {
      caseDoc.assignedUsers = updateCaseDto.assignedUsers.map(
        (userId) => new Types.ObjectId(userId),
      );
    }

    const updatedCase = await caseDoc.save();
    this.logger.log(`Case ${caseDoc.caseNumber} updated by ${currentUser.email}`);

    return this.mapToCaseResponse(updatedCase);
  }

  /**
   * Soft-deletes a case.
   * Enforces role authorization: ADMIN can delete any case; INVESTIGATOR can only delete assigned cases.
   */
  async delete(
    id: string,
    currentUser: UserProfileDto,
  ): Promise<DeleteCaseResponseDto> {
    const caseDoc = await this.caseModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!caseDoc) {
      throw new NotFoundException(`Case with ID '${id}' not found`);
    }

    // Authorization check
    this.assertCanManageCase(caseDoc, currentUser);

    caseDoc.isDeleted = true;
    caseDoc.deletedAt = new Date();
    await caseDoc.save();

    this.logger.warn(`Case ${caseDoc.caseNumber} soft-deleted by ${currentUser.email}`);

    return {
      deleted: true,
      message: `Case ${caseDoc.caseNumber} successfully deleted`,
    };
  }

  /**
   * Verifies that the current user has permission to manage (update/delete) the specified case.
   */
  private assertCanManageCase(
    caseDoc: CaseDocument,
    currentUser: UserProfileDto,
  ): void {
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    if (currentUser.role === Role.INVESTIGATOR) {
      const isCreator = caseDoc.createdBy.toString() === currentUser.id;
      const isAssigned = caseDoc.assignedUsers.some(
        (userId) => userId.toString() === currentUser.id,
      );

      if (isCreator || isAssigned) {
        return;
      }

      throw new ForbiddenException(
        'Access denied: You can only manage cases that are assigned to you',
      );
    }

    throw new ForbiddenException(
      'Access denied: You do not have permission to manage cases',
    );
  }

  /**
   * Generates sequential case number in the format: CASE-YYYY-XXXX (e.g. CASE-2026-0001)
   */
  private async generateCaseNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `CASE-${currentYear}-`;

    const latestCase = await this.caseModel
      .findOne({ caseNumber: new RegExp(`^${prefix}\\d{4}$`) })
      .sort({ caseNumber: -1 })
      .exec();

    let nextNumber = 1;
    if (latestCase && latestCase.caseNumber) {
      const parts = latestCase.caseNumber.split('-');
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        nextNumber = lastSequence + 1;
      }
    }

    const paddedSequence = String(nextNumber).padStart(4, '0');
    return `${prefix}${paddedSequence}`;
  }

  private mapToCaseResponse(caseDoc: any): CaseResponseDto {
    return {
      id: caseDoc._id.toString(),
      caseNumber: caseDoc.caseNumber,
      title: caseDoc.title,
      description: caseDoc.description,
      status: caseDoc.status,
      priority: caseDoc.priority,
      createdBy: caseDoc.createdBy,
      assignedUsers: caseDoc.assignedUsers || [],
      tags: caseDoc.tags || [],
      isDeleted: caseDoc.isDeleted,
      createdAt: caseDoc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: caseDoc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }
}
