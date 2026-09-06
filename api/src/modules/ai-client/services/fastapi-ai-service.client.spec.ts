import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  FastApiAiServiceClient,
  AiServiceException,
  AiServiceTimeoutException,
  AiServiceUnavailableException,
} from './fastapi-ai-service.client';

describe('FastApiAiServiceClient', () => {
  let client: FastApiAiServiceClient;
  let originalFetch: any;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FastApiAiServiceClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: any) => {
              if (key === 'services.aiService.url') return 'http://test-ai-service:8000';
              if (key === 'services.aiService.apiKey') return 'secret-test-key-123';
              if (key === 'services.aiService.timeoutMs') return 5000;
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    client = module.get<FastApiAiServiceClient>(FastApiAiServiceClient);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('analyzeEvidence', () => {
    it('should include internal auth headers and normalize python response', async () => {
      const mockPythonResponse = {
        case_id: 'case-99',
        evidence_id: 'ev-101',
        file_name: 'syslog.log',
        entities: [
          {
            entity_type: 'ip_address',
            entity_value: '192.168.1.50',
            normalized_value: '192.168.1.50',
            confidence: 0.95,
          },
        ],
        entity_counts: { ip_address: 1 },
        total_entities: 1,
        execution_time_ms: 12.5,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPythonResponse,
      } as Response);

      const result = await client.analyzeEvidence({
        caseId: 'case-99',
        evidenceId: 'ev-101',
        fileName: 'syslog.log',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-ai-service:8000/internal/analyze/evidence',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Internal-Service-Key': 'secret-test-key-123',
            'Authorization': 'Bearer secret-test-key-123',
          }),
        }),
      );

      expect(result.caseId).toBe('case-99');
      expect(result.evidenceId).toBe('ev-101');
      expect(result.totalEntities).toBe(1);
      expect(result.entities[0].entityType).toBe('ip_address');
      expect(result.entities[0].entityValue).toBe('192.168.1.50');
    });

    it('should throw AiServiceException on HTTP 500 or 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal engine failure' }),
      } as Response);

      await expect(
        client.analyzeEvidence({
          caseId: 'case-1',
          evidenceId: 'ev-1',
          fileName: 'test.log',
        }),
      ).rejects.toThrow(AiServiceException);
    });

    it('should throw AiServiceTimeoutException when request times out or aborts', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      global.fetch = jest.fn().mockRejectedValue(abortError);

      await expect(
        client.analyzeEvidence({
          caseId: 'case-1',
          evidenceId: 'ev-1',
          fileName: 'test.log',
        }),
      ).rejects.toThrow(AiServiceTimeoutException);
    });

    it('should throw AiServiceUnavailableException on connection failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        client.analyzeEvidence({
          caseId: 'case-1',
          evidenceId: 'ev-1',
          fileName: 'test.log',
        }),
      ).rejects.toThrow(AiServiceUnavailableException);
    });
  });

  describe('checkHealth', () => {
    it('should return true when health returns healthy status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy' }),
      } as Response);

      const isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(true);
    });

    it('should return false on failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

      const isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(false);
    });
  });
});
