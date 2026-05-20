import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('reminders')
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifs: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ appointmentId: string }>) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: job.data.appointmentId },
      include: { client: true, tenant: true, service: true },
    });
    if (!appt || appt.status === 'CANCELLED' || appt.status === 'COMPLETED') return;
    const when = appt.startAt.toLocaleString('es-CU', {
      timeZone: appt.tenant.timezone,
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const body = `Recordatorio: tu cita con ${appt.tenant.businessName} es ${when}.${
      appt.service ? ` Servicio: ${appt.service.name}.` : ''
    } Si no puedes, responde para reagendar.`;

    if (appt.client.email) {
      await this.notifs.send({
        tenantId: appt.tenantId,
        channel: 'EMAIL',
        to: appt.client.email,
        subject: 'Recordatorio de cita',
        body,
      });
    }
    await this.notifs.send({
      tenantId: appt.tenantId,
      channel: 'INAPP',
      to: appt.clientId,
      body,
    });
    this.logger.log(`Reminder dispatched for appointment ${appt.id}`);
  }
}
