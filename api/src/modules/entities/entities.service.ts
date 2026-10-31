import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Entity, EntityDocument } from './schemas/entity.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';
import { CreateEntityDto } from './dto/create-entity.dto';
import { EntityQueryDto } from './dto/entity-query.dto';
import { EntityResponseDto } from './dto/entity-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { normalizeEntityValue } from './utils/entity-normalizer';
import { EntityType } from './enums/entity-type.enum';

@Injectable()
export class EntitiesService {
  private readonly logger = new Logger(EntitiesService.name);

  constructor(
    @InjectModel(Entity.name)
    private readonly entityModel: Model<EntityDocument>,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
  ) {}

  /**
   * Retrieves paginated, filtered, and searchable entities belonging to a specific case.
   */
  async findByCaseId(
    caseId: string,
    query: EntityQueryDto,
    currentUser: UserProfileDto,
  ): Promise<PaginatedResult<EntityResponseDto>> {
    const caseDoc = await this.caseModel.findById(caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<EntityDocument> = {
      caseId: new Types.ObjectId(caseId),
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.evidenceId) {
      filter.evidenceId = new Types.ObjectId(query.evidenceId);
    }

    if (query.minConfidence !== undefined) {
      filter.confidence = { $gte: query.minConfidence };
    }

    if (query.source) {
      filter.source = new RegExp(this.escapeRegex(query.source), 'i');
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { value: searchRegex },
        { normalizedValue: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [items, total] = await Promise.all([
      this.entityModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.entityModel.countDocuments(filter).exec(),
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
   * Retrieves a single entity by its unique ID, verifying case authorization.
   */
  async findById(
    id: string,
    currentUser: UserProfileDto,
  ): Promise<EntityResponseDto> {
    const entity = await this.entityModel.findById(id).exec();
    if (!entity) {
      throw new NotFoundException(`Entity with ID '${id}' not found`);
    }

    const caseDoc = await this.caseModel.findById(entity.caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Associated case with ID '${entity.caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    return this.mapToResponse(entity);
  }

  /**
   * Upserts an entity record, performing deterministic normalization and duplicate prevention.
   */
  async upsertEntity(dto: CreateEntityDto): Promise<EntityDocument> {
    const normalizedValue =
      dto.normalizedValue?.trim() ||
      normalizeEntityValue(dto.type, dto.value);

    const filter = {
      caseId: new Types.ObjectId(dto.caseId),
      evidenceId: new Types.ObjectId(dto.evidenceId),
      type: dto.type,
      normalizedValue,
    };

    const existing = await this.entityModel.findOne(filter).exec();

    if (existing) {
      // Prevent unnecessary duplicate documents while preserving higher confidence and contextual metadata
      const incomingConfidence = typeof dto.confidence === 'number' ? dto.confidence : 1.0;
      existing.confidence = Math.max(existing.confidence, incomingConfidence);
      existing.metadata = {
        ...(existing.metadata || {}),
        ...(dto.metadata || {}),
        occurrences: ((existing.metadata?.occurrences as number) || 1) + 1,
        lastSeen: new Date().toISOString(),
      };
      return existing.save();
    }

    const newEntity = new this.entityModel({
      caseId: new Types.ObjectId(dto.caseId),
      evidenceId: new Types.ObjectId(dto.evidenceId),
      type: dto.type,
      value: dto.value.trim(),
      normalizedValue,
      confidence: typeof dto.confidence === 'number' ? dto.confidence : 1.0,
      source: dto.source.trim(),
      extractionMethod: dto.extractionMethod || 'AI_ANALYSIS',
      evidenceStrength: dto.evidenceStrength || 'MEDIUM',
      metadata: {
        ...(dto.metadata || {}),
        occurrences: 1,
        firstSeen: new Date().toISOString(),
      },
    });

    return newEntity.save();
  }

  /**
   * Bulk ingests extracted entities produced by the AI Service analysis pipeline.
   */
  async ingestExtractedEntities(
    caseId: string,
    evidenceId: string,
    defaultSource: string,
    rawEntities: Array<{
      entityType: string;
      entityValue: string;
      normalizedValue?: string;
      confidence?: number;
      context?: string;
      source?: string;
    }>,
  ): Promise<EntityDocument[]> {
    if (!rawEntities || rawEntities.length === 0) {
      return [];
    }

    const results: EntityDocument[] = [];

    for (const item of rawEntities) {
      const mappedType = this.mapRawTypeToEntityType(item.entityType);
      if (!mappedType || !item.entityValue) {
        continue;
      }

      try {
        const entityDoc = await this.upsertEntity({
          caseId,
          evidenceId,
          type: mappedType,
          value: item.entityValue,
          normalizedValue: item.normalizedValue,
          confidence: item.confidence,
          source: item.source || defaultSource,
          extractionMethod: 'AI_ANALYSIS',
          evidenceStrength: 'MEDIUM',
          metadata: item.context ? { context: item.context } : {},
        });
        results.push(entityDoc);
      } catch (err: any) {
        this.logger.warn(
          `[EntitiesService] Duplicate or insertion error for entity '${item.entityValue}': ${err.message}`,
        );
      }
    }

    this.logger.log(
      `[EntitiesService] Successfully ingested ${results.length}/${rawEntities.length} entities for evidence '${evidenceId}' in case '${caseId}'`,
    );

    return results;
  }

  private mapRawTypeToEntityType(rawType: string): EntityType | null {
    if (!rawType) return null;
    const upper = rawType.toUpperCase().replace(/[- ]/g, '_');

    switch (upper) {
      case 'PERSON':
        return EntityType.PERSON;
      case 'USER':
      case 'USER_ACCOUNT':
      case 'ACCOUNT':
        return EntityType.USER;
      case 'EMAIL':
      case 'EMAIL_ADDRESS':
        return EntityType.EMAIL;
      case 'IP':
      case 'IP_ADDRESS':
      case 'IPV4':
      case 'IPV6':
        return EntityType.IP_ADDRESS;
      case 'DEVICE':
      case 'HARDWARE':
      case 'USB':
        return EntityType.DEVICE;
      case 'FILE':
      case 'FILE_PATH':
      case 'HASH':
      case 'SHA256':
      case 'MD5':
        return EntityType.FILE;
      case 'DOMAIN':
      case 'HOSTNAME':
      case 'FQDN':
      case 'URL':
        return EntityType.DOMAIN;
      case 'LOCATION':
      case 'GEO':
        return EntityType.LOCATION;
      default:
        // Check if directly matches an enum value
        if (Object.values(EntityType).includes(upper as EntityType)) {
          return upper as EntityType;
        }
        return null;
    }
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
      'Access denied: You are not authorized to access entities for this case',
    );
  }

  private mapToResponse(doc: EntityDocument): EntityResponseDto {
    return {
      id: doc._id.toString(),
      caseId: doc.caseId.toString(),
      evidenceId: doc.evidenceId.toString(),
      type: doc.type,
      value: doc.value,
      normalizedValue: doc.normalizedValue,
      confidence: doc.confidence,
      source: doc.source,
      extractionMethod: doc.extractionMethod,
      evidenceStrength: doc.evidenceStrength,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  private escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }
}
