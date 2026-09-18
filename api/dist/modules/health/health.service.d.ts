import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { HealthResponseDto } from './dto/health-response.dto';
export declare class HealthService {
    private readonly connection;
    private readonly configService;
    constructor(connection: Connection, configService: ConfigService);
    getDatabaseStatus(): string;
    getHealth(): HealthResponseDto;
}
