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
import {
  serviceCreateSchema,
  serviceUpdateSchema,
  type ServiceCreateInput,
  type ServiceUpdateInput,
} from '@manicuba/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { ZodValidationPipe } from '../common/zod.pipe';

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.service.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(serviceCreateSchema)) body: ServiceCreateInput,
  ) {
    return this.prisma.service.create({ data: { ...body, tenantId: user.tenantId } });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(serviceUpdateSchema)) body: ServiceUpdateInput,
  ) {
    const owned = await this.prisma.service.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    return this.prisma.service.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const owned = await this.prisma.service.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    await this.prisma.service.delete({ where: { id } });
    return { ok: true };
  }
}
