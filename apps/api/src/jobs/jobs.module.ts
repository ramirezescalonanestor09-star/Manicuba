import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ReminderProcessor } from './reminder.processor';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(cfg.get('REDIS_PORT') ?? 6379),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'reminders' }),
  ],
  providers: [ReminderProcessor, RemindersService],
  exports: [RemindersService, BullModule],
})
export class JobsModule {}
