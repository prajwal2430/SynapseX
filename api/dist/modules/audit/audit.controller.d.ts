import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { PaginatedAuditLogsResponseDto } from './dto/audit-log-response.dto';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(query: QueryAuditLogsDto): Promise<PaginatedAuditLogsResponseDto>;
}
