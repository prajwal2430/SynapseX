import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimelineEvent, TimelineEventSchema } from './schemas/timeline-event.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimelineEvent.name, schema: TimelineEventSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
    AuthModule,
  ],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService, MongooseModule],
})
export class TimelineModule {}
