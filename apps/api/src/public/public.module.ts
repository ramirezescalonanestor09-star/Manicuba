import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { RequestsModule } from '../requests/requests.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [RequestsModule, MessagingModule],
  controllers: [PublicController],
})
export class PublicModule {}
