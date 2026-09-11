import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockConnection = {
    readyState: 1, // 1 = connected
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'app.name') return 'synapsex-api';
      if (key === 'app.version') return '1.0.0';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should return healthy status when database is connected', () => {
    mockConnection.readyState = 1;
    const response = controller.getHealth();

    expect(response.status).toBe('ok');
    expect(response.database.status).toBe('connected');
    expect(response.database.type).toBe('mongodb');
    expect(response.service.name).toBe('synapsex-api');
    expect(response.service.status).toBe('operational');
    expect(response.version).toBe('1.0.0');
    expect(response.timestamp).toBeDefined();
  });

  it('should return degraded status when database is disconnected', () => {
    mockConnection.readyState = 0;
    const response = controller.getHealth();

    expect(response.status).toBe('degraded');
    expect(response.database.status).toBe('disconnected');
    expect(response.database.type).toBe('mongodb');
  });
});
