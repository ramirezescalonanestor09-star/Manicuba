import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { quoteTemplateSchema, type QuoteTemplateInput } from '@manicuba/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { ZodValidationPipe } from '../common/zod.pipe';

@UseGuards(JwtAuthGuard)
@Controller('quote-templates')
export class TemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.quoteTemplate.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(quoteTemplateSchema)) body: QuoteTemplateInput,
  ) {
    return this.prisma.quoteTemplate.create({ data: { ...body, tenantId: user.tenantId } });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(quoteTemplateSchema)) body: QuoteTemplateInput,
  ) {
    const owned = await this.prisma.quoteTemplate.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    return this.prisma.quoteTemplate.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.prisma.quoteTemplate.deleteMany({
      where: { id, tenantId: user.tenantId },
    });
    return { ok: true };
  }
}
