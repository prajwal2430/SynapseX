import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChainOfCustody, ChainOfCustodySchema } from './schemas/chain-of-custody.schema';
import { Evidence, EvidenceSchema } from '../evidence/schemas/evidence.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { CustodyController } from './custody.controller';
import { CustodyService } from './custody.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChainOfCustody.name, schema: ChainOfCustodySchema },
      { name: Evidence.name, schema: EvidenceSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
    AuthModule,
  ],
  controllers: [CustodyController],
  providers: [CustodyService],
  exports: [CustodyService],
})
export class CustodyModule {}
