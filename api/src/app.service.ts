import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo() {
    return {
      service: 'SynapseX Core API',
      version: '1.0.0',
      environment: this.configService.get<string>('app.nodeEnv'),
      status: 'operational',
      docs: '/api/docs',
    };
  }
}
