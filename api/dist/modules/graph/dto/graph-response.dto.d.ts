export declare class GraphNodeDto {
    id: string;
    label: string;
    name: string;
    sourceId: string;
    sourceType: string;
    caseId: string;
    properties: Record<string, any>;
}
export declare class GraphEdgeDto {
    id: string;
    source: string;
    target: string;
    type: string;
    caseId: string;
    properties: Record<string, any>;
}
export declare class GraphSummaryDto {
    nodeCount: number;
    edgeCount: number;
    nodeCountsByLabel: Record<string, number>;
    edgeCountsByType: Record<string, number>;
}
export declare class GraphDataDto {
    caseId: string;
    nodes: GraphNodeDto[];
    edges: GraphEdgeDto[];
    summary: GraphSummaryDto;
}
export declare class GraphPathDto {
    found: boolean;
    length: number;
    nodes: GraphNodeDto[];
    edges: GraphEdgeDto[];
}
export declare class TopConnectedNodeDto {
    id: string;
    name: string;
    label: string;
    degree: number;
}
export declare class GraphMetricsDto {
    caseId: string;
    totalNodes: number;
    totalEdges: number;
    nodesByLabel: Record<string, number>;
    edgesByType: Record<string, number>;
    topConnectedNodes: TopConnectedNodeDto[];
}
export declare class GraphSyncResultDto {
    status: string;
    nodesSynced: number;
    relationshipsSynced: number;
    syncedAt: string;
}
