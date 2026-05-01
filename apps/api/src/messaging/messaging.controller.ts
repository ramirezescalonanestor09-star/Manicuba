import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod.pipe';
import { messageCreateSchema, type MessageCreateInput } from '@manicuba/shared';
import { MessagingService } from './messaging.service';

@UseGuards(JwtAuthGuard)
@Controller('threads')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.messaging.listThreadsForTenant(user.tenantId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messaging.listForTenant(user.tenantId, id);
  }

  @Post(':id/messages')
  post(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(messageCreateSchema)) body: MessageCreateInput,
  ) {
    return this.messaging.postFromManicuri(user.tenantId, id, body.body);
  }
}
