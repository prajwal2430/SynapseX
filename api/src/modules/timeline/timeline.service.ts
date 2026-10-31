import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { TimelineEvent, TimelineEventDocument } from './schemas/timeline-event.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { TimelineEventResponseDto } from './dto/timeline-event-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { parseAndNormalizeTimestamp } from './utils/timeline-normalizer';

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(
    @InjectModel(TimelineEvent.name)
    private readonly timelineEventModel: Model<TimelineEventDocument>,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
  ) {}

  /**
   * Retrieves chronologically ordered, date-range filtered, and paginated timeline events for a case.
   */
  async findByCaseId(
    caseId: string,
    query: TimelineQueryDto,
    currentUser: UserProfileDto,
  ): Promise<PaginatedResult<TimelineEventResponseDto>> {
    const caseDoc = await this.caseModel.findById(caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(200, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<TimelineEventDocument> = {
      caseId: new Types.ObjectId(caseId),
    };

    if (query.eventType) {
      filter.eventType = query.eventType;
    }

    if (query.evidenceId) {
      filter.evidenceId = new Types.ObjectId(query.evidenceId);
    }

    if (query.source) {
      filter.source = new RegExp(this.escapeRegex(query.source), 'i');
    }

    // Date range filtering on normalized UTC timestamp
    if (query.startDate || query.endDate) {
      filter.normalizedTimestamp = {};
      if (query.startDate) {
        filter.normalizedTimestamp.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.normalizedTimestamp.$lte = new Date(query.endDate);
      }
    }

    // Full-text / substring search across title and description
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Sorting: default to ascending chronological order
    const sortField = query.sortBy || 'normalizedTimestamp';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [items, total] = await Promise.all([
      this.timelineEventModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.timelineEventModel.countDocuments(filter).exec(),
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
   * Retrieves a single timeline event by its unique ID, verifying case authorization.
   */
  async findById(
    id: string,
    currentUser: UserProfileDto,
  ): Promise<TimelineEventResponseDto> {
    const event = await this.timelineEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Timeline event with ID '${id}' not found`);
    }

    const caseDoc = await this.caseModel.findById(event.caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Associated case with ID '${event.caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);

    return this.mapToResponse(event);
  }

  /**
   * Creates a timeline event, strictly preserving source timestamp & timezone
   * while computing the normalized UTC timestamp for queries.
   */
  async createTimelineEvent(
    dto: CreateTimelineEventDto,
  ): Promise<TimelineEventDocument> {
    const normalization = parseAndNormalizeTimestamp(dto.timestamp, dto.timezone);

    const normalizedDate = dto.normalizedTimestamp
      ? new Date(dto.normalizedTimestamp)
      : normalization.normalizedTimestamp;

    const event = new this.timelineEventModel({
      caseId: new Types.ObjectId(dto.caseId),
      evidenceId: new Types.ObjectId(dto.evidenceId),
      timestamp: normalization.originalTimestamp,
      timezone: normalization.timezone,
      normalizedTimestamp: isNaN(normalizedDate.getTime()) ? normalization.normalizedTimestamp : normalizedDate,
      eventType: dto.eventType.trim(),
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      source: dto.source.trim(),
      entities: dto.entities || [],
      metadata: dto.metadata || {},
    });

    return event.save();
  }

  /**
   * Bulk ingests timeline events discovered in forensic evidence artifacts.
   */
  async ingestTimelineEvents(
    caseId: string,
    evidenceId: string,
    defaultSource: string,
    events: Array<{
      timestamp: string;
      timezone?: string;
      eventType: string;
      title: string;
      description?: string;
      source?: string;
      entities?: Array<any>;
      metadata?: Record<string, any>;
    }>,
  ): Promise<TimelineEventDocument[]> {
    if (!events || events.length === 0) {
      return [];
    }

    const created: TimelineEventDocument[] = [];

    for (const ev of events) {
      try {
        const doc = await this.createTimelineEvent({
          caseId,
          evidenceId,
          timestamp: ev.timestamp,
          timezone: ev.timezone || 'UTC',
          eventType: ev.eventType,
          title: ev.title,
          description: ev.description,
          source: ev.source || defaultSource,
          entities: ev.entities,
          metadata: ev.metadata,
        });
        created.push(doc);
      } catch (err: any) {
        this.logger.warn(`[TimelineService] Failed to ingest timeline event '${ev.title}': ${err.message}`);
      }
    }

    this.logger.log(
      `[TimelineService] Successfully ingested ${created.length}/${events.length} timeline events for evidence '${evidenceId}'`,
    );

    return created;
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
      'Access denied: You are not authorized to view the timeline for this case',
    );
  }

  private mapToResponse(doc: TimelineEventDocument): TimelineEventResponseDto {
    return {
      id: doc._id.toString(),
      caseId: doc.caseId.toString(),
      evidenceId: doc.evidenceId.toString(),
      timestamp: doc.timestamp,
      timezone: doc.timezone,
      normalizedTimestamp: doc.normalizedTimestamp?.toISOString?.() || new Date().toISOString(),
      eventType: doc.eventType,
      title: doc.title,
      description: doc.description || '',
      source: doc.source,
      entities: doc.entities || [],
      metadata: doc.metadata || {},
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  private escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }
}
