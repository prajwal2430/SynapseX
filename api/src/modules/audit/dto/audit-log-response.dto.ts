import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';

export class AuditLogResponseDto {
  @ApiProperty({ example: '66da81234abcd5678ef09999' })
  id: string;

  @ApiProperty({
    type: () => Object,
    example: '66da81234abcd5678ef01234',
    nullable: true,
    description: 'User ID or populated user profile who performed the action',
  })
  userId: string | UserProfileDto | null;

  @ApiProperty({ example: 'USER_LOGGED_IN' })
  action: string;

  @ApiProperty({ example: 'Auth' })
  resourceType: string;

  @ApiProperty({ example: '66da81234abcd5678ef01234', nullable: true, required: false })
  resourceId?: string | null;

  @ApiProperty({ example: '2026-09-06T02:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '192.168.1.100', nullable: true, required: false })
  ipAddress?: string | null;

  @ApiProperty({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', nullable: true, required: false })
  userAgent?: string | null;

  @ApiProperty({
    example: { email: 'investigator@synapsex.local', status: 'success' },
    description: 'Contextual metadata produced by backend service',
  })
  metadata: Record<string, any>;
}

export class PaginationMetadataDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class PaginatedAuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  data: AuditLogResponseDto[];

  @ApiProperty({ type: PaginationMetadataDto })
  pagination: PaginationMetadataDto;
}
