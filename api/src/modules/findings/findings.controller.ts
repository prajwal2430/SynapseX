import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FindingsService } from './findings.service';
import { ReviewFindingDto } from './dto/review-finding.dto';
import { FindingQueryDto } from './dto/finding-query.dto';
import { FindingResponseDto } from './dto/finding-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@ApiTags('Findings & Human Review')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1' })
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Post('findings/:id/approve')
  @Roles(Role.ADMIN, Role.REVIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve an AI-generated forensic finding',
    description:
      'Transition finding reviewStatus to APPROVED with reviewer credentials and comment. Only accessible by REVIEWER or ADMIN. Records decision in the audit log.',
  })
  @ApiParam({ name: 'id', description: 'Finding MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Finding successfully approved',
    type: FindingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires REVIEWER or ADMIN role' })
  @ApiResponse({ status: 404, description: 'Finding not found' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ReviewFindingDto,
    @CurrentUser() currentUser: UserProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<FindingResponseDto> {
    return this.findingsService.approveFinding(id, dto, currentUser, {
      ip: ipAddress,
      userAgent,
    });
  }

  @Post('findings/:id/reject')
  @Roles(Role.ADMIN, Role.REVIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject an AI-generated forensic finding',
    description:
      'Transition finding reviewStatus to REJECTED with reviewer rationale. Only accessible by REVIEWER or ADMIN. Records decision in the audit log.',
  })
  @ApiParam({ name: 'id', description: 'Finding MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Finding successfully rejected',
    type: FindingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires REVIEWER or ADMIN role' })
  @ApiResponse({ status: 404, description: 'Finding not found' })
  async reject(
    @Param('id') id: string,
    @Body() dto: ReviewFindingDto,
    @CurrentUser() currentUser: UserProfileDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<FindingResponseDto> {
    return this.findingsService.rejectFinding(id, dto, currentUser, {
      ip: ipAddress,
      userAgent,
    });
  }

  @Get('cases/:caseId/findings')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve paginated and filtered findings for a case',
    description:
      'Fetches forensic findings for a case with filtering by reviewStatus (PENDING_REVIEW, APPROVED, REJECTED), findingType, confidenceScore, evidenceStrength, and search.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Paginated findings retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient case permissions' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async findByCase(
    @Param('caseId') caseId: string,
    @Query() query: FindingQueryDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<PaginatedResult<FindingResponseDto>> {
    return this.findingsService.findByCaseId(caseId, query, currentUser);
  }

  @Get('findings/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve single forensic finding by ID',
    description: 'Fetches detailed finding record including supporting evidence, entities, reasoning, and review status.',
  })
  @ApiParam({ name: 'id', description: 'Finding MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Finding details retrieved successfully',
    type: FindingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: User not authorized for this case' })
  @ApiResponse({ status: 404, description: 'Finding not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<FindingResponseDto> {
    return this.findingsService.findById(id, currentUser);
  }
}
