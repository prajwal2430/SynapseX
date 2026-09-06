import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Neo4jService } from './neo4j.service';
import { Case, CaseDocument } from '../cases/schemas/case.schema';
import { Evidence, EvidenceDocument } from '../evidence/schemas/evidence.schema';
import { Entity, EntityDocument } from '../entities/schemas/entity.schema';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import {
  GraphDataDto,
  GraphEdgeDto,
  GraphMetricsDto,
  GraphNodeDto,
  GraphPathDto,
  GraphSyncResultDto,
  TopConnectedNodeDto,
} from './dto/graph-response.dto';
import {
  FindPathQueryDto,
  GraphDirection,
  GraphQueryDto,
  NeighborsQueryDto,
} from './dto/graph-query.dto';
import { EntityType } from '../entities/enums/entity-type.enum';

const ALLOWED_LABELS = new Set([
  'User',
  'Person',
  'Device',
  'IPAddress',
  'Domain',
  'File',
  'Evidence',
]);

const ALLOWED_RELATIONSHIPS = new Set([
  'USED',
  'CONNECTED_TO',
  'APPEARED_IN',
  'RELATED_TO',
  'INVOLVED_IN',
]);

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private readonly neo4jService: Neo4jService,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
    @InjectModel(Evidence.name)
    private readonly evidenceModel: Model<EvidenceDocument>,
    @InjectModel(Entity.name)
    private readonly entityModel: Model<EntityDocument>,
  ) {}

  /**
   * Maps an EntityType enum to an allowed Neo4j Node label.
   */
  public mapEntityTypeToNeo4jLabel(type: string): string {
    switch (type) {
      case EntityType.PERSON:
        return 'Person';
      case EntityType.USER:
      case EntityType.EMAIL:
        return 'User';
      case EntityType.DEVICE:
        return 'Device';
      case EntityType.IP_ADDRESS:
        return 'IPAddress';
      case EntityType.DOMAIN:
        return 'Domain';
      case EntityType.FILE:
        return 'File';
      default:
        return 'Person';
    }
  }

  /**
   * Asserts that current user has permission to view the case.
   */
  public assertCanViewCase(
    caseDoc: CaseDocument,
    currentUser: UserProfileDto,
  ): void {
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    const isCreator = caseDoc.createdBy.toString() === currentUser.id;
    const isAssigned = caseDoc.assignedUsers.some(
      (userId) => userId.toString() === currentUser.id,
    );

    if (isCreator || isAssigned) {
      return;
    }

    throw new ForbiddenException(
      'Access denied: You are not authorized to view the graph for this case',
    );
  }

  /**
   * Asserts case existence and authorization.
   */
  private async getAuthorizedCase(
    caseId: string,
    currentUser: UserProfileDto,
  ): Promise<CaseDocument> {
    if (!Types.ObjectId.isValid(caseId)) {
      throw new NotFoundException(`Invalid case ID format: '${caseId}'`);
    }

    const caseDoc = await this.caseModel.findById(caseId).exec();
    if (!caseDoc || caseDoc.isDeleted) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.assertCanViewCase(caseDoc, currentUser);
    return caseDoc;
  }

  /**
   * Synchronizes all MongoDB Evidence and Entities for a case into Neo4j.
   */
  async syncCaseGraph(
    caseId: string,
    currentUser: UserProfileDto,
  ): Promise<GraphSyncResultDto> {
    await this.getAuthorizedCase(caseId, currentUser);

    if (!this.neo4jService.isAvailable()) {
      this.logger.warn(
        `Neo4j service unavailable. Skipping graph sync for case ${caseId}.`,
      );
      return {
        status: 'DEGRADED_OFFLINE',
        nodesSynced: 0,
        relationshipsSynced: 0,
        syncedAt: new Date().toISOString(),
      };
    }

    const caseObjId = new Types.ObjectId(caseId);
    const evidenceList = await this.evidenceModel
      .find({ caseId: caseObjId, isDeleted: { $ne: true } })
      .exec();
    const entitiesList = await this.entityModel
      .find({ caseId: caseObjId })
      .exec();

    let nodesSynced = 0;
    let relationshipsSynced = 0;

    // 1. Sync Evidence nodes
    for (const ev of evidenceList) {
      const cypher = `
        MERGE (e:Evidence { sourceId: $sourceId, caseId: $caseId })
        SET e.name = $name,
            e.mimeType = $mimeType,
            e.fileSize = $fileSize,
            e.sha256 = $sha256,
            e.sourceType = 'Evidence',
            e.updatedAt = datetime()
        RETURN e
      `;
      await this.neo4jService.executeWrite(cypher, {
        sourceId: ev._id.toString(),
        caseId: caseId,
        name: ev.originalFilename,
        mimeType: ev.mimeType,
        fileSize: ev.fileSize,
        sha256: ev.sha256,
      });
      nodesSynced++;
    }

    // 2. Sync Entity nodes and APPEARED_IN relationships
    for (const ent of entitiesList) {
      const label = this.mapEntityTypeToNeo4jLabel(ent.type);
      const safeLabel = ALLOWED_LABELS.has(label) ? label : 'Person';

      const entityCypher = `
        MERGE (n:${safeLabel} { sourceId: $sourceId, caseId: $caseId })
        SET n.name = $name,
            n.normalizedValue = $normalizedValue,
            n.type = $type,
            n.confidence = $confidence,
            n.source = $source,
            n.sourceType = 'Entity',
            n.updatedAt = datetime()
        RETURN n
      `;
      await this.neo4jService.executeWrite(entityCypher, {
        sourceId: ent._id.toString(),
        caseId: caseId,
        name: ent.value,
        normalizedValue: ent.normalizedValue,
        type: ent.type,
        confidence: ent.confidence,
        source: ent.source,
      });
      nodesSynced++;

      if (ent.evidenceId) {
        const relCypher = `
          MATCH (ent { sourceId: $entitySourceId, caseId: $caseId })
          MATCH (ev:Evidence { sourceId: $evidenceSourceId, caseId: $caseId })
          MERGE (ent)-[r:APPEARED_IN { caseId: $caseId }]->(ev)
          SET r.confidence = $confidence,
              r.source = $source,
              r.updatedAt = datetime()
          RETURN r
        `;
        await this.neo4jService.executeWrite(relCypher, {
          entitySourceId: ent._id.toString(),
          evidenceSourceId: ent.evidenceId.toString(),
          caseId: caseId,
          confidence: ent.confidence,
          source: ent.source,
        });
        relationshipsSynced++;
      }
    }

    // 3. Connect related entities co-occurring in the same evidence
    const crossRelCypher = `
      MATCH (a:Entity { caseId: $caseId })-[:APPEARED_IN]->(ev:Evidence { caseId: $caseId })<-[:APPEARED_IN]-(b:Entity { caseId: $caseId })
      WHERE elementId(a) < elementId(b)
      MERGE (a)-[r:RELATED_TO { caseId: $caseId }]->(b)
      SET r.updatedAt = datetime()
      RETURN count(r) as count
    `;
    const crossRes = await this.neo4jService.executeWrite(crossRelCypher, { caseId });
    if (crossRes.length > 0 && crossRes[0].has('count')) {
      relationshipsSynced += crossRes[0].get('count') || 0;
    }

    this.logger.log(
      `Synchronized graph for case ${caseId}: ${nodesSynced} nodes, ${relationshipsSynced} relationships`,
    );

    return {
      status: 'COMPLETED',
      nodesSynced,
      relationshipsSynced,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Selectively synchronizes an evidence node and its associated entities.
   * Can be invoked from background workers upon analysis completion.
   */
  async syncEvidenceEntities(
    caseId: string,
    evidenceId: string,
    evidenceName: string,
    entities: Array<{
      _id?: any;
      id?: string;
      type: string;
      value: string;
      normalizedValue?: string;
      confidence?: number;
      source?: string;
    }>,
  ): Promise<void> {
    if (!this.neo4jService.isAvailable()) {
      this.logger.debug(
        `Neo4j offline. Skipping real-time graph sync for evidence ${evidenceId}.`,
      );
      return;
    }

    try {
      // Upsert Evidence Node
      const evCypher = `
        MERGE (e:Evidence { sourceId: $sourceId, caseId: $caseId })
        SET e.name = $name,
            e.sourceType = 'Evidence',
            e.updatedAt = datetime()
        RETURN e
      `;
      await this.neo4jService.executeWrite(evCypher, {
        sourceId: evidenceId,
        caseId: caseId,
        name: evidenceName,
      });

      for (const ent of entities) {
        const entSourceId = (ent._id || ent.id || '').toString();
        if (!entSourceId) continue;

        const label = this.mapEntityTypeToNeo4jLabel(ent.type);
        const safeLabel = ALLOWED_LABELS.has(label) ? label : 'Person';

        const entCypher = `
          MERGE (n:${safeLabel} { sourceId: $sourceId, caseId: $caseId })
          SET n.name = $name,
              n.normalizedValue = $normalizedValue,
              n.type = $type,
              n.confidence = $confidence,
              n.sourceType = 'Entity',
              n.updatedAt = datetime()
          RETURN n
        `;
        await this.neo4jService.executeWrite(entCypher, {
          sourceId: entSourceId,
          caseId: caseId,
          name: ent.value,
          normalizedValue: ent.normalizedValue || ent.value,
          type: ent.type,
          confidence: ent.confidence ?? 0.8,
        });

        // Relationship
        const relCypher = `
          MATCH (ent { sourceId: $entSourceId, caseId: $caseId })
          MATCH (ev:Evidence { sourceId: $evidenceId, caseId: $caseId })
          MERGE (ent)-[r:APPEARED_IN { caseId: $caseId }]->(ev)
          SET r.confidence = $confidence,
              r.updatedAt = datetime()
          RETURN r
        `;
        await this.neo4jService.executeWrite(relCypher, {
          entSourceId,
          evidenceId,
          caseId,
          confidence: ent.confidence ?? 0.8,
        });
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to sync evidence entities to Neo4j: ${err?.message || err}`,
      );
    }
  }

  /**
   * Retrieves case graph data with optional label and relationship filtering.
   */
  async getCaseGraph(
    caseId: string,
    currentUser: UserProfileDto,
    query: GraphQueryDto = {},
  ): Promise<GraphDataDto> {
    await this.getAuthorizedCase(caseId, currentUser);

    const emptyResult: GraphDataDto = {
      caseId,
      nodes: [],
      edges: [],
      summary: {
        nodeCount: 0,
        edgeCount: 0,
        nodeCountsByLabel: {},
        edgeCountsByType: {},
      },
    };

    if (!this.neo4jService.isAvailable()) {
      return emptyResult;
    }

    const limit = Math.min(500, Math.max(1, query.limit || 100));

    // Sanitized label filtering
    const labelFilters = query.labels
      ? query.labels
          .split(',')
          .map((l) => l.trim())
          .filter((l) => ALLOWED_LABELS.has(l))
      : [];

    let nodeMatchClause = 'MATCH (n { caseId: $caseId })';
    if (labelFilters.length > 0) {
      const labelPredicate = labelFilters.map((l) => `n:${l}`).join(' OR ');
      nodeMatchClause = `MATCH (n { caseId: $caseId }) WHERE (${labelPredicate})`;
    }

    const cypher = `
      ${nodeMatchClause}
      OPTIONAL MATCH (n)-[r { caseId: $caseId }]->(m { caseId: $caseId })
      RETURN n, r, m
      LIMIT $limit
    `;

    const records = await this.neo4jService.executeRead(cypher, {
      caseId,
      limit,
    });

    return this.formatGraphData(caseId, records);
  }

  /**
   * Retrieves neighborhood subgraph around a specific node.
   */
  async getNodeNeighbors(
    caseId: string,
    nodeId: string,
    currentUser: UserProfileDto,
    query: NeighborsQueryDto = {},
  ): Promise<GraphDataDto> {
    await this.getAuthorizedCase(caseId, currentUser);

    const emptyResult: GraphDataDto = {
      caseId,
      nodes: [],
      edges: [],
      summary: {
        nodeCount: 0,
        edgeCount: 0,
        nodeCountsByLabel: {},
        edgeCountsByType: {},
      },
    };

    if (!this.neo4jService.isAvailable()) {
      return emptyResult;
    }

    const depth = Math.min(3, Math.max(1, query.depth || 1));
    const direction = query.direction || GraphDirection.BOTH;

    let traversalPattern = `-[r*1..${depth}]-`;
    if (direction === GraphDirection.OUT) {
      traversalPattern = `-[r*1..${depth}]->`;
    } else if (direction === GraphDirection.IN) {
      traversalPattern = `<-[r*1..${depth}]-`;
    }

    const cypher = `
      MATCH (start { caseId: $caseId })
      WHERE start.sourceId = $nodeId OR elementId(start) = $nodeId
      MATCH path = (start)${traversalPattern}(neighbor { caseId: $caseId })
      UNWIND nodes(path) AS n
      UNWIND relationships(path) AS r
      RETURN DISTINCT n, r
      LIMIT 150
    `;

    const records = await this.neo4jService.executeRead(cypher, {
      caseId,
      nodeId,
    });

    return this.formatGraphData(caseId, records);
  }

  /**
   * Finds the shortest path between two nodes within the case graph.
   */
  async findPath(
    caseId: string,
    currentUser: UserProfileDto,
    query: FindPathQueryDto,
  ): Promise<GraphPathDto> {
    await this.getAuthorizedCase(caseId, currentUser);

    const notFoundResult: GraphPathDto = {
      found: false,
      length: 0,
      nodes: [],
      edges: [],
    };

    if (!this.neo4jService.isAvailable()) {
      return notFoundResult;
    }

    const maxHops = Math.min(10, Math.max(1, query.maxHops || 5));

    const cypher = `
      MATCH (start { caseId: $caseId }), (target { caseId: $caseId })
      WHERE (start.sourceId = $fromNodeId OR elementId(start) = $fromNodeId)
        AND (target.sourceId = $toNodeId OR elementId(target) = $toNodeId)
      MATCH p = shortestPath((start)-[*..${maxHops}]-(target))
      RETURN nodes(p) AS pathNodes, relationships(p) AS pathEdges, length(p) AS pathLength
    `;

    const records = await this.neo4jService.executeRead(cypher, {
      caseId,
      fromNodeId: query.fromNodeId,
      toNodeId: query.toNodeId,
    });

    if (!records || records.length === 0) {
      return notFoundResult;
    }

    const record = records[0];
    const pathNodes = record.get('pathNodes') || [];
    const pathEdges = record.get('pathEdges') || [];
    const length = record.get('pathLength') || 0;

    const nodes: GraphNodeDto[] = pathNodes.map((n: any) => this.mapNode(n));
    const edges: GraphEdgeDto[] = pathEdges.map((r: any) => this.mapEdge(r));

    return {
      found: true,
      length,
      nodes,
      edges,
    };
  }

  /**
   * Computes high-level graph topology metrics for a case.
   */
  async getGraphMetrics(
    caseId: string,
    currentUser: UserProfileDto,
  ): Promise<GraphMetricsDto> {
    await this.getAuthorizedCase(caseId, currentUser);

    const emptyMetrics: GraphMetricsDto = {
      caseId,
      totalNodes: 0,
      totalEdges: 0,
      nodesByLabel: {},
      edgesByType: {},
      topConnectedNodes: [],
    };

    if (!this.neo4jService.isAvailable()) {
      return emptyMetrics;
    }

    // 1. Node counts by label
    const nodeCountsCypher = `
      MATCH (n { caseId: $caseId })
      RETURN labels(n) AS labels, count(n) AS count
    `;
    const nodeCountRecords = await this.neo4jService.executeRead(
      nodeCountsCypher,
      { caseId },
    );

    let totalNodes = 0;
    const nodesByLabel: Record<string, number> = {};
    for (const record of nodeCountRecords) {
      const labels: string[] = record.get('labels') || [];
      const count = Number(record.get('count') || 0);
      totalNodes += count;
      const primaryLabel = labels[0] || 'Unknown';
      nodesByLabel[primaryLabel] = (nodesByLabel[primaryLabel] || 0) + count;
    }

    // 2. Relationship counts by type
    const edgeCountsCypher = `
      MATCH ()-[r { caseId: $caseId }]->()
      RETURN type(r) AS type, count(r) AS count
    `;
    const edgeCountRecords = await this.neo4jService.executeRead(
      edgeCountsCypher,
      { caseId },
    );

    let totalEdges = 0;
    const edgesByType: Record<string, number> = {};
    for (const record of edgeCountRecords) {
      const type = record.get('type') || 'Unknown';
      const count = Number(record.get('count') || 0);
      totalEdges += count;
      edgesByType[type] = (edgesByType[type] || 0) + count;
    }

    // 3. Top connected nodes
    const topNodesCypher = `
      MATCH (n { caseId: $caseId })-[r { caseId: $caseId }]-()
      RETURN elementId(n) AS id, n.sourceId AS sourceId, n.name AS name, labels(n) AS labels, count(r) AS degree
      ORDER BY degree DESC
      LIMIT 10
    `;
    const topNodeRecords = await this.neo4jService.executeRead(topNodesCypher, {
      caseId,
    });

    const topConnectedNodes: TopConnectedNodeDto[] = topNodeRecords.map(
      (record) => {
        const labels: string[] = record.get('labels') || [];
        return {
          id: record.get('sourceId') || record.get('id') || '',
          name: record.get('name') || 'Unnamed',
          label: labels[0] || 'Unknown',
          degree: Number(record.get('degree') || 0),
        };
      },
    );

    return {
      caseId,
      totalNodes,
      totalEdges,
      nodesByLabel,
      edgesByType,
      topConnectedNodes,
    };
  }

  // ==========================================
  // Helper Formatters
  // ==========================================

  private mapNode(n: any): GraphNodeDto {
    const props = n.properties || {};
    const labels = n.labels || [];
    const primaryLabel = labels[0] || 'Node';
    const id = props.sourceId || n.elementId || n.identity?.toString?.() || '';

    return {
      id,
      label: primaryLabel,
      name: props.name || props.value || id,
      sourceId: props.sourceId || '',
      sourceType: props.sourceType || primaryLabel,
      caseId: props.caseId || '',
      properties: { ...props },
    };
  }

  private mapEdge(r: any): GraphEdgeDto {
    const props = r.properties || {};
    const id = r.elementId || r.identity?.toString?.() || '';
    const source = r.startNodeElementId || r.start?.toString?.() || '';
    const target = r.endNodeElementId || r.end?.toString?.() || '';

    return {
      id,
      source,
      target,
      type: r.type || 'RELATED_TO',
      caseId: props.caseId || '',
      properties: { ...props },
    };
  }

  private formatGraphData(caseId: string, records: any[]): GraphDataDto {
    const nodesMap = new Map<string, GraphNodeDto>();
    const edgesMap = new Map<string, GraphEdgeDto>();

    const nodeCountsByLabel: Record<string, number> = {};
    const edgeCountsByType: Record<string, number> = {};

    for (const record of records) {
      // Process node n
      if (record.has('n')) {
        const n = record.get('n');
        if (n) {
          const mappedNode = this.mapNode(n);
          if (!nodesMap.has(mappedNode.id)) {
            nodesMap.set(mappedNode.id, mappedNode);
            nodeCountsByLabel[mappedNode.label] =
              (nodeCountsByLabel[mappedNode.label] || 0) + 1;
          }
        }
      }

      // Process node m
      if (record.has('m')) {
        const m = record.get('m');
        if (m) {
          const mappedNode = this.mapNode(m);
          if (!nodesMap.has(mappedNode.id)) {
            nodesMap.set(mappedNode.id, mappedNode);
            nodeCountsByLabel[mappedNode.label] =
              (nodeCountsByLabel[mappedNode.label] || 0) + 1;
          }
        }
      }

      // Process relationship r
      if (record.has('r')) {
        const r = record.get('r');
        if (r) {
          const mappedEdge = this.mapEdge(r);
          if (!edgesMap.has(mappedEdge.id)) {
            edgesMap.set(mappedEdge.id, mappedEdge);
            edgeCountsByType[mappedEdge.type] =
              (edgeCountsByType[mappedEdge.type] || 0) + 1;
          }
        }
      }
    }

    const nodes = Array.from(nodesMap.values());
    const edges = Array.from(edgesMap.values());

    return {
      caseId,
      nodes,
      edges,
      summary: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeCountsByLabel,
        edgeCountsByType,
      },
    };
  }
}
