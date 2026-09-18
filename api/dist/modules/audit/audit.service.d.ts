import { Model, Types } from 'mongoose';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { PaginatedAuditLogsResponseDto } from './dto/audit-log-response.dto';
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
export declare class AuditService {
    private readonly auditLogModel;
    private readonly logger;
    constructor(auditLogModel: Model<AuditLogDocument>);
    log(input: CreateAuditLogInput): Promise<AuditLogDocument>;
    findLogs(query: QueryAuditLogsDto): Promise<PaginatedAuditLogsResponseDto>;
    private mapToResponse;
}
