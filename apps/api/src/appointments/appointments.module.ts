import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
