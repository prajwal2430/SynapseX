import { Test, TestingModule } from '@nestjs/testing';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { GraphDirection } from './dto/graph-query.dto';

describe('GraphController', () => {
  let controller: GraphController;
  let mockGraphService: Partial<GraphService>;

  const mockUser: UserProfileDto = {
    id: 'user-1',
    email: 'investigator@synapsex.local',
    name: 'Investigator Doe',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const caseId = '64bf9c0e5a9c2b3d8f1e4a01';

  beforeEach(async () => {
    mockGraphService = {
      getCaseGraph: jest.fn().mockResolvedValue({
        caseId,
        nodes: [],
        edges: [],
        summary: {
          nodeCount: 0,
          edgeCount: 0,
          nodeCountsByLabel: {},
          edgeCountsByType: {},
        },
      }),
      getNodeNeighbors: jest.fn().mockResolvedValue({
        caseId,
        nodes: [],
        edges: [],
        summary: {
          nodeCount: 0,
          edgeCount: 0,
          nodeCountsByLabel: {},
          edgeCountsByType: {},
        },
      }),
      findPath: jest.fn().mockResolvedValue({
        found: true,
        length: 2,
        nodes: [],
        edges: [],
      }),
      getGraphMetrics: jest.fn().mockResolvedValue({
        caseId,
        totalNodes: 10,
        totalEdges: 15,
        nodesByLabel: {},
        edgesByType: {},
        topConnectedNodes: [],
      }),
      syncCaseGraph: jest.fn().mockResolvedValue({
        status: 'COMPLETED',
        nodesSynced: 5,
        relationshipsSynced: 4,
        syncedAt: new Date().toISOString(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GraphController],
      providers: [{ provide: GraphService, useValue: mockGraphService }],
    }).compile();

    controller = module.get<GraphController>(GraphController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCaseGraph', () => {
    it('should delegate to graphService.getCaseGraph', async () => {
      const query = { limit: 50 };
      const res = await controller.getCaseGraph(caseId, query, mockUser);
      expect(mockGraphService.getCaseGraph).toHaveBeenCalledWith(
        caseId,
        mockUser,
        query,
      );
      expect(res.caseId).toBe(caseId);
    });
  });

  describe('getNodeNeighbors', () => {
    it('should delegate to graphService.getNodeNeighbors', async () => {
      const query = { depth: 2, direction: GraphDirection.BOTH };
      const res = await controller.getNodeNeighbors(
        caseId,
        'node-123',
        query,
        mockUser,
      );
      expect(mockGraphService.getNodeNeighbors).toHaveBeenCalledWith(
        caseId,
        'node-123',
        mockUser,
        query,
      );
      expect(res.caseId).toBe(caseId);
    });
  });

  describe('findPath', () => {
    it('should delegate to graphService.findPath', async () => {
      const query = { fromNodeId: 'node-1', toNodeId: 'node-2', maxHops: 3 };
      const res = await controller.findPath(caseId, query, mockUser);
      expect(mockGraphService.findPath).toHaveBeenCalledWith(
        caseId,
        mockUser,
        query,
      );
      expect(res.found).toBe(true);
    });
  });

  describe('getGraphMetrics', () => {
    it('should delegate to graphService.getGraphMetrics', async () => {
      const res = await controller.getGraphMetrics(caseId, mockUser);
      expect(mockGraphService.getGraphMetrics).toHaveBeenCalledWith(
        caseId,
        mockUser,
      );
      expect(res.totalNodes).toBe(10);
    });
  });

  describe('syncCaseGraph', () => {
    it('should delegate to graphService.syncCaseGraph', async () => {
      const res = await controller.syncCaseGraph(caseId, mockUser);
      expect(mockGraphService.syncCaseGraph).toHaveBeenCalledWith(
        caseId,
        mockUser,
      );
      expect(res.status).toBe('COMPLETED');
      expect(res.nodesSynced).toBe(5);
    });
  });
});
