import { Model } from 'mongoose';
import { Neo4jService } from './neo4j.service';
import { CaseDocument } from '../cases/schemas/case.schema';
import { EvidenceDocument } from '../evidence/schemas/evidence.schema';
import { EntityDocument } from '../entities/schemas/entity.schema';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { GraphDataDto, GraphMetricsDto, GraphPathDto, GraphSyncResultDto } from './dto/graph-response.dto';
import { FindPathQueryDto, GraphQueryDto, NeighborsQueryDto } from './dto/graph-query.dto';
export declare class GraphService {
    private readonly neo4jService;
    private readonly caseModel;
    private readonly evidenceModel;
    private readonly entityModel;
    private readonly logger;
    constructor(neo4jService: Neo4jService, caseModel: Model<CaseDocument>, evidenceModel: Model<EvidenceDocument>, entityModel: Model<EntityDocument>);
    mapEntityTypeToNeo4jLabel(type: string): string;
    assertCanViewCase(caseDoc: CaseDocument, currentUser: UserProfileDto): void;
    private getAuthorizedCase;
    syncCaseGraph(caseId: string, currentUser: UserProfileDto): Promise<GraphSyncResultDto>;
    syncEvidenceEntities(caseId: string, evidenceId: string, evidenceName: string, entities: Array<{
        _id?: any;
        id?: string;
        type: string;
        value: string;
        normalizedValue?: string;
        confidence?: number;
        source?: string;
    }>): Promise<void>;
    getCaseGraph(caseId: string, currentUser: UserProfileDto, query?: GraphQueryDto): Promise<GraphDataDto>;
    getNodeNeighbors(caseId: string, nodeId: string, currentUser: UserProfileDto, query?: NeighborsQueryDto): Promise<GraphDataDto>;
    findPath(caseId: string, currentUser: UserProfileDto, query: FindPathQueryDto): Promise<GraphPathDto>;
    getGraphMetrics(caseId: string, currentUser: UserProfileDto): Promise<GraphMetricsDto>;
    private mapNode;
    private mapEdge;
    private formatGraphData;
}
