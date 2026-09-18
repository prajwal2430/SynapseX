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
var GraphService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const neo4j_service_1 = require("./neo4j.service");
const case_schema_1 = require("../cases/schemas/case.schema");
const evidence_schema_1 = require("../evidence/schemas/evidence.schema");
const entity_schema_1 = require("../entities/schemas/entity.schema");
const role_enum_1 = require("../../common/enums/role.enum");
const graph_query_dto_1 = require("./dto/graph-query.dto");
const entity_type_enum_1 = require("../entities/enums/entity-type.enum");
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
let GraphService = GraphService_1 = class GraphService {
    constructor(neo4jService, caseModel, evidenceModel, entityModel) {
        this.neo4jService = neo4jService;
        this.caseModel = caseModel;
        this.evidenceModel = evidenceModel;
        this.entityModel = entityModel;
        this.logger = new common_1.Logger(GraphService_1.name);
    }
    mapEntityTypeToNeo4jLabel(type) {
        switch (type) {
            case entity_type_enum_1.EntityType.PERSON:
                return 'Person';
            case entity_type_enum_1.EntityType.USER:
            case entity_type_enum_1.EntityType.EMAIL:
                return 'User';
            case entity_type_enum_1.EntityType.DEVICE:
                return 'Device';
            case entity_type_enum_1.EntityType.IP_ADDRESS:
                return 'IPAddress';
            case entity_type_enum_1.EntityType.DOMAIN:
                return 'Domain';
            case entity_type_enum_1.EntityType.FILE:
                return 'File';
            default:
                return 'Person';
        }
    }
    assertCanViewCase(caseDoc, currentUser) {
        if (currentUser.role === role_enum_1.Role.ADMIN) {
            return;
        }
        const isCreator = caseDoc.createdBy.toString() === currentUser.id;
        const isAssigned = caseDoc.assignedUsers.some((userId) => userId.toString() === currentUser.id);
        if (isCreator || isAssigned) {
            return;
        }
        throw new common_1.ForbiddenException('Access denied: You are not authorized to view the graph for this case');
    }
    async getAuthorizedCase(caseId, currentUser) {
        if (!mongoose_2.Types.ObjectId.isValid(caseId)) {
            throw new common_1.NotFoundException(`Invalid case ID format: '${caseId}'`);
        }
        const caseDoc = await this.caseModel.findById(caseId).exec();
        if (!caseDoc || caseDoc.isDeleted) {
            throw new common_1.NotFoundException(`Case with ID '${caseId}' not found`);
        }
        this.assertCanViewCase(caseDoc, currentUser);
        return caseDoc;
    }
    async syncCaseGraph(caseId, currentUser) {
        await this.getAuthorizedCase(caseId, currentUser);
        if (!this.neo4jService.isAvailable()) {
            this.logger.warn(`Neo4j service unavailable. Skipping graph sync for case ${caseId}.`);
            return {
                status: 'DEGRADED_OFFLINE',
                nodesSynced: 0,
                relationshipsSynced: 0,
                syncedAt: new Date().toISOString(),
            };
        }
        const caseObjId = new mongoose_2.Types.ObjectId(caseId);
        const evidenceList = await this.evidenceModel
            .find({ caseId: caseObjId, isDeleted: { $ne: true } })
            .exec();
        const entitiesList = await this.entityModel
            .find({ caseId: caseObjId })
            .exec();
        let nodesSynced = 0;
        let relationshipsSynced = 0;
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
        this.logger.log(`Synchronized graph for case ${caseId}: ${nodesSynced} nodes, ${relationshipsSynced} relationships`);
        return {
            status: 'COMPLETED',
            nodesSynced,
            relationshipsSynced,
            syncedAt: new Date().toISOString(),
        };
    }
    async syncEvidenceEntities(caseId, evidenceId, evidenceName, entities) {
        if (!this.neo4jService.isAvailable()) {
            this.logger.debug(`Neo4j offline. Skipping real-time graph sync for evidence ${evidenceId}.`);
            return;
        }
        try {
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
                if (!entSourceId)
                    continue;
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
        }
        catch (err) {
            this.logger.error(`Failed to sync evidence entities to Neo4j: ${err?.message || err}`);
        }
    }
    async getCaseGraph(caseId, currentUser, query = {}) {
        await this.getAuthorizedCase(caseId, currentUser);
        const emptyResult = {
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
    async getNodeNeighbors(caseId, nodeId, currentUser, query = {}) {
        await this.getAuthorizedCase(caseId, currentUser);
        const emptyResult = {
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
        const direction = query.direction || graph_query_dto_1.GraphDirection.BOTH;
        let traversalPattern = `-[r*1..${depth}]-`;
        if (direction === graph_query_dto_1.GraphDirection.OUT) {
            traversalPattern = `-[r*1..${depth}]->`;
        }
        else if (direction === graph_query_dto_1.GraphDirection.IN) {
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
    async findPath(caseId, currentUser, query) {
        await this.getAuthorizedCase(caseId, currentUser);
        const notFoundResult = {
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
        const nodes = pathNodes.map((n) => this.mapNode(n));
        const edges = pathEdges.map((r) => this.mapEdge(r));
        return {
            found: true,
            length,
            nodes,
            edges,
        };
    }
    async getGraphMetrics(caseId, currentUser) {
        await this.getAuthorizedCase(caseId, currentUser);
        const emptyMetrics = {
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
        const nodeCountsCypher = `
      MATCH (n { caseId: $caseId })
      RETURN labels(n) AS labels, count(n) AS count
    `;
        const nodeCountRecords = await this.neo4jService.executeRead(nodeCountsCypher, { caseId });
        let totalNodes = 0;
        const nodesByLabel = {};
        for (const record of nodeCountRecords) {
            const labels = record.get('labels') || [];
            const count = Number(record.get('count') || 0);
            totalNodes += count;
            const primaryLabel = labels[0] || 'Unknown';
            nodesByLabel[primaryLabel] = (nodesByLabel[primaryLabel] || 0) + count;
        }
        const edgeCountsCypher = `
      MATCH ()-[r { caseId: $caseId }]->()
      RETURN type(r) AS type, count(r) AS count
    `;
        const edgeCountRecords = await this.neo4jService.executeRead(edgeCountsCypher, { caseId });
        let totalEdges = 0;
        const edgesByType = {};
        for (const record of edgeCountRecords) {
            const type = record.get('type') || 'Unknown';
            const count = Number(record.get('count') || 0);
            totalEdges += count;
            edgesByType[type] = (edgesByType[type] || 0) + count;
        }
        const topNodesCypher = `
      MATCH (n { caseId: $caseId })-[r { caseId: $caseId }]-()
      RETURN elementId(n) AS id, n.sourceId AS sourceId, n.name AS name, labels(n) AS labels, count(r) AS degree
      ORDER BY degree DESC
      LIMIT 10
    `;
        const topNodeRecords = await this.neo4jService.executeRead(topNodesCypher, {
            caseId,
        });
        const topConnectedNodes = topNodeRecords.map((record) => {
            const labels = record.get('labels') || [];
            return {
                id: record.get('sourceId') || record.get('id') || '',
                name: record.get('name') || 'Unnamed',
                label: labels[0] || 'Unknown',
                degree: Number(record.get('degree') || 0),
            };
        });
        return {
            caseId,
            totalNodes,
            totalEdges,
            nodesByLabel,
            edgesByType,
            topConnectedNodes,
        };
    }
    mapNode(n) {
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
    mapEdge(r) {
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
    formatGraphData(caseId, records) {
        const nodesMap = new Map();
        const edgesMap = new Map();
        const nodeCountsByLabel = {};
        const edgeCountsByType = {};
        for (const record of records) {
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
};
exports.GraphService = GraphService;
exports.GraphService = GraphService = GraphService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(case_schema_1.Case.name)),
    __param(2, (0, mongoose_1.InjectModel)(evidence_schema_1.Evidence.name)),
    __param(3, (0, mongoose_1.InjectModel)(entity_schema_1.Entity.name)),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], GraphService);
//# sourceMappingURL=graph.service.js.map