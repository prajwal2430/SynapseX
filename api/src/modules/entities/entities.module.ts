import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from './schemas/entity.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Entity.name, schema: EntitySchema },
      { name: Case.name, schema: CaseSchema },
    ]),
    AuthModule,
  ],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService, MongooseModule],
})
export class EntitiesModule {}
