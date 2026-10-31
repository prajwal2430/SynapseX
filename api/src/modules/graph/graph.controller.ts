import {
  Controller,
  Get,
  Post,
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
import { GraphService } from './graph.service';
import {
  FindPathQueryDto,
  GraphQueryDto,
  NeighborsQueryDto,
} from './dto/graph-query.dto';
import {
  GraphDataDto,
  GraphMetricsDto,
  GraphPathDto,
  GraphSyncResultDto,
} from './dto/graph-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Knowledge Graph')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1' })
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('cases/:caseId/graph')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve knowledge graph for a case',
    description:
      'Fetches nodes (User, Person, Device, IPAddress, Domain, File, Evidence) and relationships (USED, CONNECTED_TO, APPEARED_IN, RELATED_TO, INVOLVED_IN) for visualization.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Graph data retrieved successfully',
    type: GraphDataDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient case permissions' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async getCaseGraph(
    @Param('caseId') caseId: string,
    @Query() query: GraphQueryDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<GraphDataDto> {
    return this.graphService.getCaseGraph(caseId, currentUser, query);
  }

  @Get('cases/:caseId/graph/neighbors/:nodeId')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve 1-3 hop neighborhood graph for a specific node',
    description:
      'Expands the graph topology around a target entity or evidence node within the case.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiParam({ name: 'nodeId', description: 'Node source identifier or graph element ID' })
  @ApiResponse({
    status: 200,
    description: 'Node neighborhood retrieved successfully',
    type: GraphDataDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient case permissions' })
  @ApiResponse({ status: 404, description: 'Case or Node not found' })
  async getNodeNeighbors(
    @Param('caseId') caseId: string,
    @Param('nodeId') nodeId: string,
    @Query() query: NeighborsQueryDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<GraphDataDto> {
    return this.graphService.getNodeNeighbors(caseId, nodeId, currentUser, query);
  }

  @Get('cases/:caseId/graph/path')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find shortest path between two nodes in the case graph',
    description:
      'Performs graph pathfinding to uncover investigative connections between two entities or evidence items.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Path search completed',
    type: GraphPathDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient case permissions' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async findPath(
    @Param('caseId') caseId: string,
    @Query() query: FindPathQueryDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<GraphPathDto> {
    return this.graphService.findPath(caseId, currentUser, query);
  }

  @Get('cases/:caseId/graph/metrics')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve case graph metrics and topology statistics',
    description:
      'Provides node and relationship counts by type, plus top connected nodes by degree.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Graph metrics retrieved successfully',
    type: GraphMetricsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient case permissions' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async getGraphMetrics(
    @Param('caseId') caseId: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<GraphMetricsDto> {
    return this.graphService.getGraphMetrics(caseId, currentUser);
  }

  @Post('cases/:caseId/graph/sync')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Synchronize case evidence and entities into the Neo4j Knowledge Graph',
    description:
      'Selectively synchronizes MongoDB case evidence and forensic entities to Neo4j graph nodes and relationships.',
  })
  @ApiParam({ name: 'caseId', description: 'Case MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Graph synchronization completed',
    type: GraphSyncResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions to sync case graph' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async syncCaseGraph(
    @Param('caseId') caseId: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<GraphSyncResultDto> {
    return this.graphService.syncCaseGraph(caseId, currentUser);
  }
}
