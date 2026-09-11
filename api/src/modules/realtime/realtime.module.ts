import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { EventsGateway } from './gateways/events.gateway';
import { RealtimeEventsService } from './services/realtime-events.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
  ],
  providers: [EventsGateway, RealtimeEventsService],
  exports: [EventsGateway, RealtimeEventsService],
})
export class RealtimeModule {}
