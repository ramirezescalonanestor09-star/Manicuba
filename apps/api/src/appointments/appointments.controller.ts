import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  type AppointmentCreateInput,
  type AppointmentUpdateInput,
} from '@manicuba/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { ZodValidationPipe } from '../common/zod.pipe';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId: user.tenantId,
        ...(from || to
          ? {
              startAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: {
        client: { select: { id: true, fullName: true, phoneE164: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(appointmentCreateSchema)) body: AppointmentCreateInput,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: body.clientId, tenantId: user.tenantId },
    });
    if (!client) throw new NotFoundException('Clienta no encontrada');
    return this.prisma.appointment.create({
      data: {
        tenantId: user.tenantId,
        clientId: body.clientId,
        serviceId: body.serviceId,
        requestId: body.requestId,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        priceFinal: body.priceFinal,
        currency: body.currency,
        notes: body.notes,
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(appointmentUpdateSchema)) body: AppointmentUpdateInput,
  ) {
    const owned = await this.prisma.appointment.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    return this.prisma.appointment.update({
      where: { id },
      data: {
        startAt: body.startAt ? new Date(body.startAt) : undefined,
        endAt: body.endAt ? new Date(body.endAt) : undefined,
        status: body.status,
        priceFinal: body.priceFinal,
        currency: body.currency,
        notes: body.notes,
      },
    });
  }
}
