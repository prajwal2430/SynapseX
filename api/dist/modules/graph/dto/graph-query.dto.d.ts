export declare enum GraphDirection {
    BOTH = "BOTH",
    IN = "IN",
    OUT = "OUT"
}
export declare class GraphQueryDto {
    labels?: string;
    relationshipTypes?: string;
    limit?: number;
}
export declare class NeighborsQueryDto {
    depth?: number;
    direction?: GraphDirection;
    relationshipTypes?: string;
}
export declare class FindPathQueryDto {
    fromNodeId: string;
    toNodeId: string;
    maxHops?: number;
}
