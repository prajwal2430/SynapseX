import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import {
  PaginatedAuditLogsResponseDto,
  AuditLogResponseDto,
} from './dto/audit-log-response.dto';
import { AuditAction } from './enums/audit-action.enum';

export interface CreateAuditLogInput {
  userId?: string | Types.ObjectId | null;
  action: AuditAction | string;
  resourceType: string;
  resourceId?: string | Types.ObjectId | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Reusable method for backend services to record an immutable audit event.
   * Invoked server-side; not directly populated from untrusted client requests.
   */
  async log(input: CreateAuditLogInput): Promise<AuditLogDocument> {
    try {
      const userObjectId =
        input.userId && Types.ObjectId.isValid(input.userId.toString())
          ? new Types.ObjectId(input.userId.toString())
          : null;

      const resourceIdStr = input.resourceId ? input.resourceId.toString() : null;

      const auditRecord = new this.auditLogModel({
        userId: userObjectId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: resourceIdStr,
        timestamp: input.timestamp || new Date(),
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        metadata: input.metadata || {},
      });

      const saved = await auditRecord.save();
      this.logger.debug(
        `[Audit] Recorded action: '${input.action}' on ${input.resourceType}:${resourceIdStr || 'N/A'} by user '${userObjectId || 'ANONYMOUS'}'`,
      );
      return saved;
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Queries audit logs with pagination, filtering by action, user, resource, and date range.
   */
  async findLogs(query: QueryAuditLogsDto): Promise<PaginatedAuditLogsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.userId && Types.ObjectId.isValid(query.userId)) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.action) {
      filter.action = query.action.trim();
    }

    if (query.resourceType) {
      filter.resourceType = query.resourceType.trim();
    }

    if (query.resourceId) {
      filter.resourceId = query.resourceId.trim();
    }

    // Date range filtering
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) {
        filter.timestamp.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.timestamp.$lte = new Date(query.endDate);
      }
    }

    const [total, records] = await Promise.all([
      this.auditLogModel.countDocuments(filter).exec(),
      this.auditLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: records.map((doc) => this.mapToResponse(doc)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private mapToResponse(doc: any): AuditLogResponseDto {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      action: doc.action,
      resourceType: doc.resourceType,
      resourceId: doc.resourceId || null,
      timestamp: doc.timestamp?.toISOString?.() || new Date(doc.timestamp).toISOString(),
      ipAddress: doc.ipAddress || null,
      userAgent: doc.userAgent || null,
      metadata: doc.metadata || {},
    };
  }
}
