import {
  Controller,
  Get,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { TimelineEventResponseDto } from './dto/timeline-event-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@ApiTags('Timeline')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1' })
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('cases/:caseId/timeline')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve chronologically ordered timeline events for a case',
    description:
      'Fetches timeline events normalized to UTC with preserved source timestamps, supporting date-range filtering, text search, sorting, and pagination.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Paginated timeline events retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient case permissions' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async findByCase(
    @Param('caseId') caseId: string,
    @Query() query: TimelineQueryDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<PaginatedResult<TimelineEventResponseDto>> {
    return this.timelineService.findByCaseId(caseId, query, currentUser);
  }

  @Get('timeline-events/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve single timeline event by ID',
    description:
      'Fetches timeline event record with original and UTC normalized timestamps, associated entities, and source metadata.',
  })
  @ApiParam({ name: 'id', description: 'Timeline Event MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Timeline event retrieved successfully',
    type: TimelineEventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: User not authorized for this case' })
  @ApiResponse({ status: 404, description: 'Timeline event not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<TimelineEventResponseDto> {
    return this.timelineService.findById(id, currentUser);
  }
}
