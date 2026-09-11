import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  getDatabaseStatus(): string {
    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const readyState = this.connection?.readyState ?? 0;
    return stateMap[readyState] || 'unknown';
  }

  getHealth(): HealthResponseDto {
    const dbStatus = this.getDatabaseStatus();
    const serviceName = this.configService.get<string>('app.name', 'synapsex-api');
    const version = this.configService.get<string>('app.version', '1.0.0');
    const isHealthy = dbStatus === 'connected' || dbStatus === 'connecting';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      service: {
        name: serviceName,
        status: 'operational',
        uptime: process.uptime(),
      },
      database: {
        status: dbStatus,
        type: 'mongodb',
      },
      timestamp: new Date().toISOString(),
      version,
    };
  }
}
