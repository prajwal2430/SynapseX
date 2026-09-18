import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Driver, Record as Neo4jRecord } from 'neo4j-driver';
export declare class Neo4jService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private driver;
    private isConnected;
    private defaultDatabase;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    isAvailable(): boolean;
    getDriver(): Driver | null;
    executeRead(cypher: string, params?: Record<string, any>, database?: string): Promise<Neo4jRecord[]>;
    executeWrite(cypher: string, params?: Record<string, any>, database?: string): Promise<Neo4jRecord[]>;
    checkHealth(): Promise<{
        status: 'up' | 'down' | 'degraded';
        details?: any;
    }>;
}
