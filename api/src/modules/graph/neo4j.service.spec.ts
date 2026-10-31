import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import neo4j from 'neo4j-driver';

const mockDriverFn = jest.fn();

jest.mock('neo4j-driver', () => {
  return {
    __esModule: true,
    default: {
      driver: (...args: any[]) => mockDriverFn(...args),
      session: {
        READ: 'READ',
        WRITE: 'WRITE',
      },
      auth: {
        basic: jest.fn().mockReturnValue({}),
      },
    },
    driver: (...args: any[]) => mockDriverFn(...args),
    session: {
      READ: 'READ',
      WRITE: 'WRITE',
    },
    auth: {
      basic: jest.fn().mockReturnValue({}),
    },
  };
});

describe('Neo4jService', () => {
  let service: Neo4jService;
  let mockConfigService: Partial<ConfigService>;
  let mockDriver: any;
  let mockSession: any;

  beforeEach(async () => {
    mockSession = {
      executeRead: jest.fn(),
      executeWrite: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockDriver = {
      verifyConnectivity: jest.fn().mockResolvedValue(undefined),
      getServerInfo: jest.fn().mockResolvedValue({
        address: 'localhost:7687',
        agent: 'Neo4j/5.0.0',
        protocolVersion: 5.0,
      }),
      session: jest.fn().mockReturnValue(mockSession),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockDriverFn.mockReturnValue(mockDriver);

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const configMap: Record<string, any> = {
          'neo4j.uri': 'bolt://localhost:7687',
          'neo4j.username': 'neo4j',
          'neo4j.password': 'password123',
          'neo4j.database': 'neo4j',
        };
        return configMap[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Neo4jService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<Neo4jService>(Neo4jService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize driver and verify connectivity onModuleInit', async () => {
    await service.onModuleInit();
    expect(mockDriverFn).toHaveBeenCalled();
    expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
    expect(service.isAvailable()).toBe(true);
  });

  it('should gracefully handle connection failure onModuleInit without throwing', async () => {
    mockDriver.verifyConnectivity.mockRejectedValueOnce(new Error('Connection refused'));
    await service.onModuleInit();
    expect(service.isAvailable()).toBe(false);
  });

  it('should handle missing credentials gracefully onModuleInit', async () => {
    (mockConfigService.get as jest.Mock).mockReturnValue(undefined);
    await service.onModuleInit();
    expect(service.isAvailable()).toBe(false);
  });

  it('should close driver onModuleDestroy', async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();
    expect(mockDriver.close).toHaveBeenCalled();
  });

  it('should executeRead successfully', async () => {
    await service.onModuleInit();
    const fakeRecords = [{ get: () => 'val' }];
    mockSession.executeRead.mockImplementation(async (cb: any) => {
      const tx = { run: jest.fn().mockResolvedValue({ records: fakeRecords }) };
      return cb(tx);
    });

    const records = await service.executeRead('MATCH (n) RETURN n', { p: 1 });
    expect(records).toEqual(fakeRecords);
    expect(mockSession.close).toHaveBeenCalled();
  });

  it('should executeWrite successfully', async () => {
    await service.onModuleInit();
    const fakeRecords = [{ get: () => 'written' }];
    mockSession.executeWrite.mockImplementation(async (cb: any) => {
      const tx = { run: jest.fn().mockResolvedValue({ records: fakeRecords }) };
      return cb(tx);
    });

    const records = await service.executeWrite('CREATE (n:Test) RETURN n');
    expect(records).toEqual(fakeRecords);
    expect(mockSession.close).toHaveBeenCalled();
  });

  it('should return empty records when executeRead is called while offline', async () => {
    const records = await service.executeRead('MATCH (n) RETURN n');
    expect(records).toEqual([]);
  });

  it('should check health correctly when connected', async () => {
    await service.onModuleInit();
    const health = await service.checkHealth();
    expect(health.status).toBe('up');
    expect(health.details.agent).toBe('Neo4j/5.0.0');
  });

  it('should check health correctly when driver not initialized', async () => {
    const health = await service.checkHealth();
    expect(health.status).toBe('down');
  });
});
