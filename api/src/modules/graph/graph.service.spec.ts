import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { GraphService } from './graph.service';
import { Neo4jService } from './neo4j.service';
import { Case } from '../cases/schemas/case.schema';
import { Evidence } from '../evidence/schemas/evidence.schema';
import { Entity } from '../entities/schemas/entity.schema';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { EntityType } from '../entities/enums/entity-type.enum';
import { GraphDirection } from './dto/graph-query.dto';

describe('GraphService', () => {
  let service: GraphService;
  let mockNeo4jService: Partial<Neo4jService>;
  let mockCaseModel: any;
  let mockEvidenceModel: any;
  let mockEntityModel: any;

  const adminUserId = new Types.ObjectId().toString();
  const analystUserId = new Types.ObjectId().toString();
  const outsiderUserId = new Types.ObjectId().toString();
  const creatorUserId = new Types.ObjectId();

  const adminUser: UserProfileDto = {
    id: adminUserId,
    email: 'admin@synapsex.local',
    name: 'Admin User',
    role: Role.ADMIN,
    isActive: true,
  };

  const analystUser: UserProfileDto = {
    id: analystUserId,
    email: 'analyst@synapsex.local',
    name: 'Analyst User',
    role: Role.ANALYST,
    isActive: true,
  };

  const outsiderUser: UserProfileDto = {
    id: outsiderUserId,
    email: 'outsider@synapsex.local',
    name: 'Outsider User',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const caseId = new Types.ObjectId().toString();
  const mockCaseDoc = {
    _id: new Types.ObjectId(caseId),
    caseNumber: 'CASE-2026-001',
    title: 'Operation Blue Sky',
    createdBy: creatorUserId,
    assignedUsers: [new Types.ObjectId(analystUserId)],
    isDeleted: false,
  };

  beforeEach(async () => {
    mockNeo4jService = {
      isAvailable: jest.fn().mockReturnValue(true),
      executeRead: jest.fn().mockResolvedValue([]),
      executeWrite: jest.fn().mockResolvedValue([]),
    };

    mockCaseModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDoc),
      }),
    };

    mockEvidenceModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            caseId: new Types.ObjectId(caseId),
            originalFilename: 'disk_dump.raw',
            mimeType: 'application/octet-stream',
            fileSize: 1024,
            sha256: 'abc123sha256',
          },
        ]),
      }),
    };

    mockEntityModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            caseId: new Types.ObjectId(caseId),
            evidenceId: new Types.ObjectId(),
            type: EntityType.IP_ADDRESS,
            value: '192.168.1.100',
            normalizedValue: '192.168.1.100',
            confidence: 0.95,
            source: 'disk_dump.raw',
          },
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphService,
        { provide: Neo4jService, useValue: mockNeo4jService },
        { provide: getModelToken(Case.name), useValue: mockCaseModel },
        { provide: getModelToken(Evidence.name), useValue: mockEvidenceModel },
        { provide: getModelToken(Entity.name), useValue: mockEntityModel },
      ],
    }).compile();

    service = module.get<GraphService>(GraphService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapEntityTypeToNeo4jLabel', () => {
    it('should map entities to corresponding Neo4j node labels', () => {
      expect(service.mapEntityTypeToNeo4jLabel(EntityType.PERSON)).toBe('Person');
      expect(service.mapEntityTypeToNeo4jLabel(EntityType.USER)).toBe('User');
      expect(service.mapEntityTypeToNeo4jLabel(EntityType.EMAIL)).toBe('User');
      expect(service.mapEntityTypeToNeo4jLabel(EntityType.DEVICE)).toBe('Device');
      expect(service.mapEntityTypeToNeo4jLabel(EntityType.IP_ADDRESS)).toBe('IPAddress');
      expect(service.mapEntityTypeToNeo4jLabel(EntityType.DOMAIN)).toBe('Domain');
      expect(service.mapEntityTypeToNeo4jLabel(EntityType.FILE)).toBe('File');
      expect(service.mapEntityTypeToNeo4jLabel('UNKNOWN_TYPE')).toBe('Person');
    });
  });

  describe('Authorization & Case Access', () => {
    it('should allow ADMIN access to any case', () => {
      expect(() =>
        service.assertCanViewCase(mockCaseDoc as any, adminUser),
      ).not.toThrow();
    });

    it('should allow assigned user access to case', () => {
      expect(() =>
        service.assertCanViewCase(mockCaseDoc as any, analystUser),
      ).not.toThrow();
    });

    it('should forbid unassigned, non-admin user access to case', () => {
      expect(() =>
        service.assertCanViewCase(mockCaseDoc as any, outsiderUser),
      ).toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for invalid caseId format', async () => {
      await expect(
        service.getCaseGraph('invalid-id', adminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if case does not exist or is deleted', async () => {
      mockCaseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getCaseGraph(caseId, adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncCaseGraph', () => {
    it('should return DEGRADED_OFFLINE if Neo4j is offline', async () => {
      (mockNeo4jService.isAvailable as jest.Mock).mockReturnValue(false);

      const result = await service.syncCaseGraph(caseId, adminUser);
      expect(result.status).toBe('DEGRADED_OFFLINE');
      expect(result.nodesSynced).toBe(0);
    });

    it('should synchronize evidence, entities, and cross-relationships when online', async () => {
      (mockNeo4jService.executeWrite as jest.Mock)
        .mockResolvedValueOnce([]) // evidence
        .mockResolvedValueOnce([]) // entity
        .mockResolvedValueOnce([]) // rel
        .mockResolvedValueOnce([{ has: () => true, get: () => 3 }]); // cross rels

      const result = await service.syncCaseGraph(caseId, adminUser);

      expect(result.status).toBe('COMPLETED');
      expect(result.nodesSynced).toBe(2);
      expect(result.relationshipsSynced).toBe(4);
      expect(mockNeo4jService.executeWrite).toHaveBeenCalledTimes(4);
    });
  });

  describe('syncEvidenceEntities', () => {
    it('should skip real-time sync when Neo4j is offline', async () => {
      (mockNeo4jService.isAvailable as jest.Mock).mockReturnValue(false);

      await service.syncEvidenceEntities(caseId, 'ev-1', 'test.log', [
        { type: EntityType.IP_ADDRESS, value: '10.0.0.1', id: 'ent-1' },
      ]);

      expect(mockNeo4jService.executeWrite).not.toHaveBeenCalled();
    });

    it('should upsert evidence and entity nodes when online', async () => {
      await service.syncEvidenceEntities(caseId, 'ev-1', 'test.log', [
        { type: EntityType.IP_ADDRESS, value: '10.0.0.1', id: 'ent-1' },
      ]);

      expect(mockNeo4jService.executeWrite).toHaveBeenCalledTimes(3); // evidence + entity + rel
    });
  });

  describe('getCaseGraph', () => {
    it('should return empty graph if Neo4j is offline', async () => {
      (mockNeo4jService.isAvailable as jest.Mock).mockReturnValue(false);

      const graph = await service.getCaseGraph(caseId, adminUser);
      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.summary.nodeCount).toBe(0);
    });

    it('should query Neo4j and format nodes, edges, and summary', async () => {
      const mockRecord = {
        has: (key: string) => key === 'n' || key === 'r' || key === 'm',
        get: (key: string) => {
          if (key === 'n') {
            return {
              labels: ['IPAddress'],
              elementId: 'node-1',
              properties: {
                sourceId: 'src-ip-1',
                name: '192.168.1.1',
                caseId,
              },
            };
          }
          if (key === 'm') {
            return {
              labels: ['Evidence'],
              elementId: 'node-2',
              properties: {
                sourceId: 'src-ev-1',
                name: 'log.txt',
                caseId,
              },
            };
          }
          if (key === 'r') {
            return {
              type: 'APPEARED_IN',
              elementId: 'rel-1',
              startNodeElementId: 'src-ip-1',
              endNodeElementId: 'src-ev-1',
              properties: { caseId },
            };
          }
          return null;
        },
      };

      (mockNeo4jService.executeRead as jest.Mock).mockResolvedValue([mockRecord]);

      const graph = await service.getCaseGraph(caseId, adminUser, {
        labels: 'IPAddress,Evidence',
      });

      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(1);
      expect(graph.summary.nodeCount).toBe(2);
      expect(graph.summary.edgeCount).toBe(1);
      expect(graph.summary.nodeCountsByLabel.IPAddress).toBe(1);
      expect(graph.summary.edgeCountsByType.APPEARED_IN).toBe(1);
    });
  });

  describe('getNodeNeighbors', () => {
    it('should return neighbors subgraph', async () => {
      const mockRecord = {
        has: (key: string) => key === 'n',
        get: () => ({
          labels: ['Person'],
          elementId: 'node-person-1',
          properties: { sourceId: 'person-1', name: 'John Doe', caseId },
        }),
      };
      (mockNeo4jService.executeRead as jest.Mock).mockResolvedValue([mockRecord]);

      const result = await service.getNodeNeighbors(caseId, 'person-1', adminUser, {
        depth: 2,
        direction: GraphDirection.BOTH,
      });

      expect(result.nodes.length).toBe(1);
      expect(result.nodes[0].name).toBe('John Doe');
    });
  });

  describe('findPath', () => {
    it('should return found=false if no path exists', async () => {
      (mockNeo4jService.executeRead as jest.Mock).mockResolvedValue([]);

      const path = await service.findPath(caseId, adminUser, {
        fromNodeId: 'node-a',
        toNodeId: 'node-b',
        maxHops: 3,
      });

      expect(path.found).toBe(false);
      expect(path.nodes).toEqual([]);
    });

    it('should return found=true and path details when path exists', async () => {
      const mockRecord = {
        get: (key: string) => {
          if (key === 'pathNodes') {
            return [
              {
                labels: ['Person'],
                elementId: 'n1',
                properties: { sourceId: 'n1', name: 'Alice' },
              },
              {
                labels: ['Device'],
                elementId: 'n2',
                properties: { sourceId: 'n2', name: 'MacBook' },
              },
            ];
          }
          if (key === 'pathEdges') {
            return [
              {
                type: 'USED',
                elementId: 'e1',
                startNodeElementId: 'n1',
                endNodeElementId: 'n2',
                properties: {},
              },
            ];
          }
          if (key === 'pathLength') {
            return 1;
          }
          return null;
        },
      };

      (mockNeo4jService.executeRead as jest.Mock).mockResolvedValue([mockRecord]);

      const path = await service.findPath(caseId, adminUser, {
        fromNodeId: 'n1',
        toNodeId: 'n2',
      });

      expect(path.found).toBe(true);
      expect(path.length).toBe(1);
      expect(path.nodes.length).toBe(2);
      expect(path.edges.length).toBe(1);
    });
  });

  describe('getGraphMetrics', () => {
    it('should calculate nodesByLabel, edgesByType and top connected nodes', async () => {
      (mockNeo4jService.executeRead as jest.Mock)
        .mockResolvedValueOnce([
          { get: (k: string) => (k === 'labels' ? ['IPAddress'] : 5) },
          { get: (k: string) => (k === 'labels' ? ['Device'] : 3) },
        ])
        .mockResolvedValueOnce([
          { get: (k: string) => (k === 'type' ? 'APPEARED_IN' : 8) },
        ])
        .mockResolvedValueOnce([
          {
            get: (k: string) => {
              if (k === 'sourceId') return 'node-10';
              if (k === 'name') return 'Server A';
              if (k === 'labels') return ['Device'];
              if (k === 'degree') return 6;
              return null;
            },
          },
        ]);

      const metrics = await service.getGraphMetrics(caseId, adminUser);

      expect(metrics.totalNodes).toBe(8);
      expect(metrics.nodesByLabel.IPAddress).toBe(5);
      expect(metrics.nodesByLabel.Device).toBe(3);
      expect(metrics.totalEdges).toBe(8);
      expect(metrics.edgesByType.APPEARED_IN).toBe(8);
      expect(metrics.topConnectedNodes.length).toBe(1);
      expect(metrics.topConnectedNodes[0].name).toBe('Server A');
      expect(metrics.topConnectedNodes[0].degree).toBe(6);
    });
  });
});
