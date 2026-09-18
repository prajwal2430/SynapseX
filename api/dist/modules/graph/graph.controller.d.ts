import { GraphService } from './graph.service';
import { FindPathQueryDto, GraphQueryDto, NeighborsQueryDto } from './dto/graph-query.dto';
import { GraphDataDto, GraphMetricsDto, GraphPathDto, GraphSyncResultDto } from './dto/graph-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
export declare class GraphController {
    private readonly graphService;
    constructor(graphService: GraphService);
    getCaseGraph(caseId: string, query: GraphQueryDto, currentUser: UserProfileDto): Promise<GraphDataDto>;
    getNodeNeighbors(caseId: string, nodeId: string, query: NeighborsQueryDto, currentUser: UserProfileDto): Promise<GraphDataDto>;
    findPath(caseId: string, query: FindPathQueryDto, currentUser: UserProfileDto): Promise<GraphPathDto>;
    getGraphMetrics(caseId: string, currentUser: UserProfileDto): Promise<GraphMetricsDto>;
    syncCaseGraph(caseId: string, currentUser: UserProfileDto): Promise<GraphSyncResultDto>;
}
