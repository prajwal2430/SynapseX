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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphSyncResultDto = exports.GraphMetricsDto = exports.TopConnectedNodeDto = exports.GraphPathDto = exports.GraphDataDto = exports.GraphSummaryDto = exports.GraphEdgeDto = exports.GraphNodeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class GraphNodeDto {
}
exports.GraphNodeDto = GraphNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Graph node unique identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a10' }),
    __metadata("design:type", String)
], GraphNodeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Primary node label/type', example: 'IPAddress' }),
    __metadata("design:type", String)
], GraphNodeDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display name or value of the node', example: '192.168.1.50' }),
    __metadata("design:type", String)
], GraphNodeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Associated MongoDB source document ID', example: '64bf9c0e5a9c2b3d8f1e4a10' }),
    __metadata("design:type", String)
], GraphNodeDto.prototype, "sourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source type (e.g., Entity, Evidence, User)', example: 'Entity' }),
    __metadata("design:type", String)
], GraphNodeDto.prototype, "sourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Associated case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' }),
    __metadata("design:type", String)
], GraphNodeDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional node properties and metadata', type: Object }),
    __metadata("design:type", Object)
], GraphNodeDto.prototype, "properties", void 0);
class GraphEdgeDto {
}
exports.GraphEdgeDto = GraphEdgeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Graph edge unique identifier', example: 'edge-rel-123' }),
    __metadata("design:type", String)
], GraphEdgeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source node identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a10' }),
    __metadata("design:type", String)
], GraphEdgeDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target node identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a02' }),
    __metadata("design:type", String)
], GraphEdgeDto.prototype, "target", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Relationship type', example: 'APPEARED_IN' }),
    __metadata("design:type", String)
], GraphEdgeDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Associated case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' }),
    __metadata("design:type", String)
], GraphEdgeDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Edge metadata and properties (e.g. confidence, timestamp)', type: Object }),
    __metadata("design:type", Object)
], GraphEdgeDto.prototype, "properties", void 0);
class GraphSummaryDto {
}
exports.GraphSummaryDto = GraphSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total count of nodes in the graph view', example: 12 }),
    __metadata("design:type", Number)
], GraphSummaryDto.prototype, "nodeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total count of edges in the graph view', example: 15 }),
    __metadata("design:type", Number)
], GraphSummaryDto.prototype, "edgeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Count of nodes per label', example: { IPAddress: 4, Person: 2, Evidence: 3 } }),
    __metadata("design:type", Object)
], GraphSummaryDto.prototype, "nodeCountsByLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Count of edges per relationship type', example: { APPEARED_IN: 8, CONNECTED_TO: 4 } }),
    __metadata("design:type", Object)
], GraphSummaryDto.prototype, "edgeCountsByType", void 0);
class GraphDataDto {
}
exports.GraphDataDto = GraphDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Associated case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' }),
    __metadata("design:type", String)
], GraphDataDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of graph nodes', type: [GraphNodeDto] }),
    __metadata("design:type", Array)
], GraphDataDto.prototype, "nodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of graph relationships', type: [GraphEdgeDto] }),
    __metadata("design:type", Array)
], GraphDataDto.prototype, "edges", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Summary statistics of the graph', type: GraphSummaryDto }),
    __metadata("design:type", GraphSummaryDto)
], GraphDataDto.prototype, "summary", void 0);
class GraphPathDto {
}
exports.GraphPathDto = GraphPathDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a connecting path was found', example: true }),
    __metadata("design:type", Boolean)
], GraphPathDto.prototype, "found", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of hops along the path', example: 3 }),
    __metadata("design:type", Number)
], GraphPathDto.prototype, "length", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nodes along the shortest path', type: [GraphNodeDto] }),
    __metadata("design:type", Array)
], GraphPathDto.prototype, "nodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Edges along the shortest path', type: [GraphEdgeDto] }),
    __metadata("design:type", Array)
], GraphPathDto.prototype, "edges", void 0);
class TopConnectedNodeDto {
}
exports.TopConnectedNodeDto = TopConnectedNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Node identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a10' }),
    __metadata("design:type", String)
], TopConnectedNodeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display name', example: '192.168.1.50' }),
    __metadata("design:type", String)
], TopConnectedNodeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Primary label', example: 'IPAddress' }),
    __metadata("design:type", String)
], TopConnectedNodeDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Degree of connectivity (number of connected edges)', example: 7 }),
    __metadata("design:type", Number)
], TopConnectedNodeDto.prototype, "degree", void 0);
class GraphMetricsDto {
}
exports.GraphMetricsDto = GraphMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' }),
    __metadata("design:type", String)
], GraphMetricsDto.prototype, "caseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total nodes in case graph', example: 25 }),
    __metadata("design:type", Number)
], GraphMetricsDto.prototype, "totalNodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total relationships in case graph', example: 40 }),
    __metadata("design:type", Number)
], GraphMetricsDto.prototype, "totalEdges", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nodes categorized by label', example: { Person: 5, Device: 3, Evidence: 4 } }),
    __metadata("design:type", Object)
], GraphMetricsDto.prototype, "nodesByLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Relationships categorized by type', example: { APPEARED_IN: 20, USED: 10 } }),
    __metadata("design:type", Object)
], GraphMetricsDto.prototype, "edgesByType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Top connected nodes by degree', type: [TopConnectedNodeDto] }),
    __metadata("design:type", Array)
], GraphMetricsDto.prototype, "topConnectedNodes", void 0);
class GraphSyncResultDto {
}
exports.GraphSyncResultDto = GraphSyncResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Synchronization status', example: 'COMPLETED' }),
    __metadata("design:type", String)
], GraphSyncResultDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of nodes synchronized or updated', example: 18 }),
    __metadata("design:type", Number)
], GraphSyncResultDto.prototype, "nodesSynced", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of relationships synchronized', example: 22 }),
    __metadata("design:type", Number)
], GraphSyncResultDto.prototype, "relationshipsSynced", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp of synchronization', example: '2026-09-06T03:00:00.000Z' }),
    __metadata("design:type", String)
], GraphSyncResultDto.prototype, "syncedAt", void 0);
//# sourceMappingURL=graph-response.dto.js.map