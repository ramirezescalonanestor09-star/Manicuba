import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ChatGateway } from './chat.gateway';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [ConfigModule, JwtModule.register({}), UploadsModule],
  controllers: [MessagingController],
  providers: [MessagingService, ChatGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
