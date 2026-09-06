import { registerAs } from '@nestjs/config';

export const neo4jConfig = registerAs('neo4j', () => ({
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'synapsex_neo4j_password',
  database: process.env.NEO4J_DATABASE || 'neo4j',
}));
