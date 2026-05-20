import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { UploadsModule } from '../uploads/uploads.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [ConfigModule, UploadsModule, JobsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
