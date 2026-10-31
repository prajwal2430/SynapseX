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
import { EntitiesService } from './entities.service';
import { EntityQueryDto } from './dto/entity-query.dto';
import { EntityResponseDto } from './dto/entity-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@ApiTags('Entities')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1' })
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Get('cases/:caseId/entities')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve paginated and filtered entities for a case',
    description:
      'Fetches forensic entities (PERSON, USER, EMAIL, IP_ADDRESS, DEVICE, FILE, DOMAIN, LOCATION) discovered across case evidence, with full-text search and filtering options.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Paginated entities retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient case permissions' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async findByCase(
    @Param('caseId') caseId: string,
    @Query() query: EntityQueryDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<PaginatedResult<EntityResponseDto>> {
    return this.entitiesService.findByCaseId(caseId, query, currentUser);
  }

  @Get('entities/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve single forensic entity by ID',
    description: 'Fetches detailed entity record including normalized value, confidence, and source metadata.',
  })
  @ApiParam({ name: 'id', description: 'Entity MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Entity details retrieved successfully',
    type: EntityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: User not authorized for this case' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<EntityResponseDto> {
    return this.entitiesService.findById(id, currentUser);
  }
}
