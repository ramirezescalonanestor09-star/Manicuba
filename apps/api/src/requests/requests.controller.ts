import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  quoteCreateSchema,
  requestStatusUpdateSchema,
  type QuoteCreateInput,
} from '@manicuba/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod.pipe';
import { RequestsService } from './requests.service';

@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.requests.listForTenant(user.tenantId, status);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.requests.getForTenant(user.tenantId, id);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(requestStatusUpdateSchema)) body: { status: string },
  ) {
    return this.requests.setStatus(user.tenantId, id, body.status);
  }

  @Post(':id/quote')
  quote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(quoteCreateSchema)) body: QuoteCreateInput,
  ) {
    return this.requests.createQuote(user.tenantId, id, body);
  }
}
