import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  clientCreateSchema,
  clientUpdateSchema,
  normalizePhone,
  type ClientCreateInput,
  type ClientUpdateInput,
} from '@manicuba/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { ZodValidationPipe } from '../common/zod.pipe';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.prisma.client.findMany({
      where: {
        tenantId: user.tenantId,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phoneE164: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { fullName: 'asc' },
      take: 200,
    });
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        appointments: { orderBy: { startAt: 'desc' }, take: 20 },
        requests: { orderBy: { createdAt: 'desc' }, take: 20, include: { quote: true } },
      },
    });
    if (!client) throw new NotFoundException();
    return client;
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(clientCreateSchema)) body: ClientCreateInput,
  ) {
    return this.prisma.client.create({
      data: {
        tenantId: user.tenantId,
        fullName: body.fullName,
        phoneE164: normalizePhone(body.phone),
        email: body.email,
        notesPrivate: body.notesPrivate,
        allergies: body.allergies,
        preferences: body.preferences,
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(clientUpdateSchema)) body: ClientUpdateInput,
  ) {
    const owned = await this.prisma.client.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    return this.prisma.client.update({
      where: { id },
      data: {
        fullName: body.fullName,
        phoneE164: body.phone ? normalizePhone(body.phone) : undefined,
        email: body.email,
        notesPrivate: body.notesPrivate,
        allergies: body.allergies,
        preferences: body.preferences,
      },
    });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const owned = await this.prisma.client.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    await this.prisma.client.delete({ where: { id } });
    return { ok: true };
  }
}
