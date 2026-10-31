import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, auth, QueryResult, Record as Neo4jRecord } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver | null = null;
  private isConnected = false;
  private defaultDatabase: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultDatabase =
      this.configService.get<string>('neo4j.database') || 'neo4j';
  }

  async onModuleInit(): Promise<void> {
    const uri = this.configService.get<string>('neo4j.uri');
    const username = this.configService.get<string>('neo4j.username');
    const password = this.configService.get<string>('neo4j.password');

    if (!uri || !username || !password) {
      this.logger.warn(
        'Neo4j credentials or URI not fully configured. Graph service will operate in offline/degraded mode.',
      );
      return;
    }

    try {
      this.driver = neo4j.driver(uri, auth.basic(username, password), {
        disableLosslessIntegers: true,
      });

      await this.driver.verifyConnectivity();
      this.isConnected = true;
      this.logger.log(`Connected to Neo4j database at ${uri}`);
    } catch (error: any) {
      this.isConnected = false;
      this.logger.warn(
        `Failed to connect to Neo4j at ${uri}: ${error?.message || error}. Graph operations will be skipped or return empty results until connection is restored.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.driver) {
      try {
        await this.driver.close();
        this.logger.log('Closed Neo4j driver connection.');
      } catch (error: any) {
        this.logger.error(`Error closing Neo4j driver: ${error?.message || error}`);
      }
    }
  }

  isAvailable(): boolean {
    return this.isConnected && this.driver !== null;
  }

  getDriver(): Driver | null {
    return this.driver;
  }

  async executeRead(
    cypher: string,
    params: Record<string, any> = {},
    database?: string,
  ): Promise<Neo4jRecord[]> {
    if (!this.driver || !this.isConnected) {
      this.logger.warn('executeRead invoked while Neo4j is not connected.');
      return [];
    }

    const session: Session = this.driver.session({
      database: database || this.defaultDatabase,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      const result: QueryResult = await session.executeRead((tx) =>
        tx.run(cypher, params),
      );
      return result.records;
    } catch (error: any) {
      this.logger.error(`Cypher read error: ${error?.message || error}`, error?.stack);
      throw error;
    } finally {
      await session.close();
    }
  }

  async executeWrite(
    cypher: string,
    params: Record<string, any> = {},
    database?: string,
  ): Promise<Neo4jRecord[]> {
    if (!this.driver || !this.isConnected) {
      this.logger.warn('executeWrite invoked while Neo4j is not connected.');
      return [];
    }

    const session: Session = this.driver.session({
      database: database || this.defaultDatabase,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      const result: QueryResult = await session.executeWrite((tx) =>
        tx.run(cypher, params),
      );
      return result.records;
    } catch (error: any) {
      this.logger.error(`Cypher write error: ${error?.message || error}`, error?.stack);
      throw error;
    } finally {
      await session.close();
    }
  }

  async checkHealth(): Promise<{ status: 'up' | 'down' | 'degraded'; details?: any }> {
    if (!this.driver) {
      return { status: 'down', details: { message: 'Driver not initialized' } };
    }

    try {
      const serverInfo = await this.driver.getServerInfo();
      return {
        status: 'up',
        details: {
          address: serverInfo.address,
          agent: serverInfo.agent,
          protocolVersion: serverInfo.protocolVersion,
        },
      };
    } catch (error: any) {
      return {
        status: 'down',
        details: { message: error?.message || 'Failed to verify connectivity' },
      };
    }
  }
}
