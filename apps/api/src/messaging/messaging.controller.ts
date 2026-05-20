import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

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

  @Post(':id/messages/attachments')
  @UseInterceptors(
    FilesInterceptor('images', 5, { limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  postWithAttachments(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('body') body: string,
  ) {
    if (!body && (!files || files.length === 0)) {
      throw new BadRequestException('Mensaje o adjunto requerido');
    }
    return this.messaging.postFromManicuri(user.tenantId, id, body ?? '', files ?? []);
  }
}
