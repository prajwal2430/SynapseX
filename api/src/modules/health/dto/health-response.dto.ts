import { ApiProperty } from '@nestjs/swagger';

export class ServiceStatusDto {
  @ApiProperty({ example: 'synapsex-api' })
  name: string;

  @ApiProperty({ example: 'operational' })
  status: string;

  @ApiProperty({ example: 42.5 })
  uptime: number;
}

export class DatabaseStatusDto {
  @ApiProperty({ example: 'connected', enum: ['connected', 'connecting', 'disconnected', 'disconnecting'] })
  status: string;

  @ApiProperty({ example: 'mongodb' })
  type: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ type: ServiceStatusDto })
  service: ServiceStatusDto;

  @ApiProperty({ type: DatabaseStatusDto })
  database: DatabaseStatusDto;

  @ApiProperty({ example: '2026-09-06T01:05:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;
}
