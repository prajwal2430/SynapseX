import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Finding, FindingSchema } from './schemas/finding.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finding.name, schema: FindingSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
    AuthModule,
  ],
  controllers: [FindingsController],
  providers: [FindingsService],
  exports: [FindingsService, MongooseModule],
})
export class FindingsModule {}
