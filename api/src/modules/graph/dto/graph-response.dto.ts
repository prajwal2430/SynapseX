import { ApiProperty } from '@nestjs/swagger';

export class GraphNodeDto {
  @ApiProperty({ description: 'Graph node unique identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a10' })
  id: string;

  @ApiProperty({ description: 'Primary node label/type', example: 'IPAddress' })
  label: string;

  @ApiProperty({ description: 'Display name or value of the node', example: '192.168.1.50' })
  name: string;

  @ApiProperty({ description: 'Associated MongoDB source document ID', example: '64bf9c0e5a9c2b3d8f1e4a10' })
  sourceId: string;

  @ApiProperty({ description: 'Source type (e.g., Entity, Evidence, User)', example: 'Entity' })
  sourceType: string;

  @ApiProperty({ description: 'Associated case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' })
  caseId: string;

  @ApiProperty({ description: 'Additional node properties and metadata', type: Object })
  properties: Record<string, any>;
}

export class GraphEdgeDto {
  @ApiProperty({ description: 'Graph edge unique identifier', example: 'edge-rel-123' })
  id: string;

  @ApiProperty({ description: 'Source node identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a10' })
  source: string;

  @ApiProperty({ description: 'Target node identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a02' })
  target: string;

  @ApiProperty({ description: 'Relationship type', example: 'APPEARED_IN' })
  type: string;

  @ApiProperty({ description: 'Associated case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' })
  caseId: string;

  @ApiProperty({ description: 'Edge metadata and properties (e.g. confidence, timestamp)', type: Object })
  properties: Record<string, any>;
}

export class GraphSummaryDto {
  @ApiProperty({ description: 'Total count of nodes in the graph view', example: 12 })
  nodeCount: number;

  @ApiProperty({ description: 'Total count of edges in the graph view', example: 15 })
  edgeCount: number;

  @ApiProperty({ description: 'Count of nodes per label', example: { IPAddress: 4, Person: 2, Evidence: 3 } })
  nodeCountsByLabel: Record<string, number>;

  @ApiProperty({ description: 'Count of edges per relationship type', example: { APPEARED_IN: 8, CONNECTED_TO: 4 } })
  edgeCountsByType: Record<string, number>;
}

export class GraphDataDto {
  @ApiProperty({ description: 'Associated case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' })
  caseId: string;

  @ApiProperty({ description: 'List of graph nodes', type: [GraphNodeDto] })
  nodes: GraphNodeDto[];

  @ApiProperty({ description: 'List of graph relationships', type: [GraphEdgeDto] })
  edges: GraphEdgeDto[];

  @ApiProperty({ description: 'Summary statistics of the graph', type: GraphSummaryDto })
  summary: GraphSummaryDto;
}

export class GraphPathDto {
  @ApiProperty({ description: 'Whether a connecting path was found', example: true })
  found: boolean;

  @ApiProperty({ description: 'Number of hops along the path', example: 3 })
  length: number;

  @ApiProperty({ description: 'Nodes along the shortest path', type: [GraphNodeDto] })
  nodes: GraphNodeDto[];

  @ApiProperty({ description: 'Edges along the shortest path', type: [GraphEdgeDto] })
  edges: GraphEdgeDto[];
}

export class TopConnectedNodeDto {
  @ApiProperty({ description: 'Node identifier', example: 'node-64bf9c0e5a9c2b3d8f1e4a10' })
  id: string;

  @ApiProperty({ description: 'Display name', example: '192.168.1.50' })
  name: string;

  @ApiProperty({ description: 'Primary label', example: 'IPAddress' })
  label: string;

  @ApiProperty({ description: 'Degree of connectivity (number of connected edges)', example: 7 })
  degree: number;
}

export class GraphMetricsDto {
  @ApiProperty({ description: 'Case ID', example: '64bf9c0e5a9c2b3d8f1e4a01' })
  caseId: string;

  @ApiProperty({ description: 'Total nodes in case graph', example: 25 })
  totalNodes: number;

  @ApiProperty({ description: 'Total relationships in case graph', example: 40 })
  totalEdges: number;

  @ApiProperty({ description: 'Nodes categorized by label', example: { Person: 5, Device: 3, Evidence: 4 } })
  nodesByLabel: Record<string, number>;

  @ApiProperty({ description: 'Relationships categorized by type', example: { APPEARED_IN: 20, USED: 10 } })
  edgesByType: Record<string, number>;

  @ApiProperty({ description: 'Top connected nodes by degree', type: [TopConnectedNodeDto] })
  topConnectedNodes: TopConnectedNodeDto[];
}

export class GraphSyncResultDto {
  @ApiProperty({ description: 'Synchronization status', example: 'COMPLETED' })
  status: string;

  @ApiProperty({ description: 'Number of nodes synchronized or updated', example: 18 })
  nodesSynced: number;

  @ApiProperty({ description: 'Number of relationships synchronized', example: 22 })
  relationshipsSynced: number;

  @ApiProperty({ description: 'Timestamp of synchronization', example: '2026-09-06T03:00:00.000Z' })
  syncedAt: string;
}
