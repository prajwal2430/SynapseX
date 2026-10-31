import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { PaginatedAuditLogsResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Audit Logging')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1', path: 'audit-logs' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve paginated system audit logs (ADMIN only)',
    description:
      'Queries backend-generated immutable audit events. Supports pagination, user filtering, action filtering, resource filtering, and ISO date ranges. Strictly read-only; editing or deleting audit logs is prohibited.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated audit log entries retrieved successfully',
    type: PaginatedAuditLogsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only ADMIN users can access global audit logs' })
  async getAuditLogs(
    @Query() query: QueryAuditLogsDto,
  ): Promise<PaginatedAuditLogsResponseDto> {
    return this.auditService.findLogs(query);
  }
}
