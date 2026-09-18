import { UserProfileDto } from '../../auth/dto/auth-response.dto';
export declare class AuditLogResponseDto {
    id: string;
    userId: string | UserProfileDto | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    timestamp: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata: Record<string, any>;
}
export declare class PaginationMetadataDto {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export declare class PaginatedAuditLogsResponseDto {
    data: AuditLogResponseDto[];
    pagination: PaginationMetadataDto;
}
