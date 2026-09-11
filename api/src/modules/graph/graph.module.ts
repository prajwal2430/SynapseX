import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { Evidence, EvidenceSchema } from '../evidence/schemas/evidence.schema';
import { Entity, EntitySchema } from '../entities/schemas/entity.schema';
import { Neo4jService } from './neo4j.service';
import { GraphService } from './graph.service';
import { GraphController } from './graph.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Case.name, schema: CaseSchema },
      { name: Evidence.name, schema: EvidenceSchema },
      { name: Entity.name, schema: EntitySchema },
    ]),
  ],
  controllers: [GraphController],
  providers: [Neo4jService, GraphService],
  exports: [GraphService, Neo4jService],
})
export class GraphModule {}
