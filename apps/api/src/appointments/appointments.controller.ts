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
import { z } from 'zod';
import {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  type AppointmentCreateInput,
  type AppointmentUpdateInput,
} from '@manicuba/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { ZodValidationPipe } from '../common/zod.pipe';
import { AvailabilityService } from '../availability/availability.service';
import { RemindersService } from '../jobs/reminders.service';

const paymentSchema = z.object({
  amountPaid: z.number().nonnegative(),
  tipAmount: z.number().nonnegative().optional(),
  currency: z.enum(['CUP', 'MLC', 'USD']),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'CARD', 'MLC_CARD', 'ZELLE', 'OTHER']),
  paidAt: z.string().datetime().optional(),
});

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly reminders: RemindersService,
    private readonly audit: AuditService,
  ) {}

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
        client: {
          select: {
            id: true,
            fullName: true,
            phoneE164: true,
            loyaltyPoints: true,
          },
        },
        service: { select: { id: true, name: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phoneE164: true,
            loyaltyPoints: true,
            email: true,
          },
        },
        service: { select: { id: true, name: true } },
        request: { select: { publicToken: true } },
      },
    });
    if (!appt) throw new NotFoundException();
    return appt;
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
    const start = new Date(body.startAt);
    const end = new Date(body.endAt);
    await this.availability.assertSlotFree(user.tenantId, start, end);
    const created = await this.prisma.appointment.create({
      data: {
        tenantId: user.tenantId,
        clientId: body.clientId,
        serviceId: body.serviceId,
        requestId: body.requestId,
        startAt: start,
        endAt: end,
        priceFinal: body.priceFinal,
        currency: body.currency,
        notes: body.notes,
      },
    });
    const jobId = await this.reminders.scheduleAppointment(created.id, start);
    if (jobId) {
      await this.prisma.appointment.update({
        where: { id: created.id },
        data: { reminderJobId: jobId },
      });
    }
    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: created.id,
    });
    return created;
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
    if (body.startAt || body.endAt) {
      const start = new Date(body.startAt ?? owned.startAt);
      const end = new Date(body.endAt ?? owned.endAt);
      await this.availability.assertSlotFree(user.tenantId, start, end, id);
    }
    const updated = await this.prisma.appointment.update({
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
    if (
      updated.status === 'CANCELLED' ||
      (body.startAt && new Date(body.startAt).getTime() !== owned.startAt.getTime())
    ) {
      await this.reminders.cancelJob(owned.reminderJobId);
      if (updated.status !== 'CANCELLED') {
        const newJob = await this.reminders.scheduleAppointment(updated.id, updated.startAt);
        if (newJob) {
          await this.prisma.appointment.update({
            where: { id: updated.id },
            data: { reminderJobId: newJob },
          });
        }
      }
    }
    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: id,
      metadata: body as Record<string, unknown>,
    });
    return updated;
  }

  @Patch(':id/payment')
  async payment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(paymentSchema)) body: z.infer<typeof paymentSchema>,
  ) {
    const owned = await this.prisma.appointment.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        amountPaid: body.amountPaid,
        tipAmount: body.tipAmount,
        currency: body.currency,
        paymentMethod: body.paymentMethod,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        status: 'COMPLETED',
      },
      include: { client: true, tenant: true },
    });
    await this.prisma.client.update({
      where: { id: updated.clientId },
      data: { loyaltyPoints: { increment: 1 } },
    });
    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'PAY',
      entity: 'Appointment',
      entityId: id,
      metadata: body as Record<string, unknown>,
    });
    return updated;
  }
}
