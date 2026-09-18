"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const graph_service_1 = require("./graph.service");
const graph_query_dto_1 = require("./dto/graph-query.dto");
const graph_response_dto_1 = require("./dto/graph-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const auth_response_dto_1 = require("../auth/dto/auth-response.dto");
const role_enum_1 = require("../../common/enums/role.enum");
let GraphController = class GraphController {
    constructor(graphService) {
        this.graphService = graphService;
    }
    async getCaseGraph(caseId, query, currentUser) {
        return this.graphService.getCaseGraph(caseId, currentUser, query);
    }
    async getNodeNeighbors(caseId, nodeId, query, currentUser) {
        return this.graphService.getNodeNeighbors(caseId, nodeId, currentUser, query);
    }
    async findPath(caseId, query, currentUser) {
        return this.graphService.findPath(caseId, currentUser, query);
    }
    async getGraphMetrics(caseId, currentUser) {
        return this.graphService.getGraphMetrics(caseId, currentUser);
    }
    async syncCaseGraph(caseId, currentUser) {
        return this.graphService.syncCaseGraph(caseId, currentUser);
    }
};
exports.GraphController = GraphController;
__decorate([
    (0, common_1.Get)('cases/:caseId/graph'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve knowledge graph for a case',
        description: 'Fetches nodes (User, Person, Device, IPAddress, Domain, File, Evidence) and relationships (USED, CONNECTED_TO, APPEARED_IN, RELATED_TO, INVOLVED_IN) for visualization.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'Case MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Graph data retrieved successfully',
        type: graph_response_dto_1.GraphDataDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient case permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, graph_query_dto_1.GraphQueryDto,
        auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], GraphController.prototype, "getCaseGraph", null);
__decorate([
    (0, common_1.Get)('cases/:caseId/graph/neighbors/:nodeId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve 1-3 hop neighborhood graph for a specific node',
        description: 'Expands the graph topology around a target entity or evidence node within the case.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'Case MongoDB ObjectId' }),
    (0, swagger_1.ApiParam)({ name: 'nodeId', description: 'Node source identifier or graph element ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Node neighborhood retrieved successfully',
        type: graph_response_dto_1.GraphDataDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient case permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case or Node not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, common_1.Param)('nodeId')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, graph_query_dto_1.NeighborsQueryDto,
        auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], GraphController.prototype, "getNodeNeighbors", null);
__decorate([
    (0, common_1.Get)('cases/:caseId/graph/path'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Find shortest path between two nodes in the case graph',
        description: 'Performs graph pathfinding to uncover investigative connections between two entities or evidence items.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'Case MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Path search completed',
        type: graph_response_dto_1.GraphPathDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient case permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, graph_query_dto_1.FindPathQueryDto,
        auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], GraphController.prototype, "findPath", null);
__decorate([
    (0, common_1.Get)('cases/:caseId/graph/metrics'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve case graph metrics and topology statistics',
        description: 'Provides node and relationship counts by type, plus top connected nodes by degree.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'Case MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Graph metrics retrieved successfully',
        type: graph_response_dto_1.GraphMetricsDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient case permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], GraphController.prototype, "getGraphMetrics", null);
__decorate([
    (0, common_1.Post)('cases/:caseId/graph/sync'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Synchronize case evidence and entities into the Neo4j Knowledge Graph',
        description: 'Selectively synchronizes MongoDB case evidence and forensic entities to Neo4j graph nodes and relationships.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'Case MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Graph synchronization completed',
        type: graph_response_dto_1.GraphSyncResultDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient permissions to sync case graph' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], GraphController.prototype, "syncCaseGraph", null);
exports.GraphController = GraphController = __decorate([
    (0, swagger_1.ApiTags)('Knowledge Graph'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [graph_service_1.GraphService])
], GraphController);
//# sourceMappingURL=graph.controller.js.map