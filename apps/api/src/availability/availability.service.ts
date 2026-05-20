import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Throws if the slot collides with another appointment or falls outside
   * the tenant's working windows / inside a blocked exception.
   */
  async assertSlotFree(
    tenantId: string,
    startAt: Date,
    endAt: Date,
    ignoreAppointmentId?: string,
  ): Promise<void> {
    if (endAt <= startAt) {
      throw new BadRequestException('La hora final debe ser despues del inicio');
    }

    const conflicts = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        id: ignoreAppointmentId ? { not: ignoreAppointmentId } : undefined,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, startAt: true, endAt: true },
    });
    if (conflicts.length > 0) {
      throw new BadRequestException('Ya existe una cita en ese horario');
    }

    const dayOfWeek = startAt.getDay();
    const startTimeStr = toHHmm(startAt);
    const endTimeStr = toHHmm(endAt);
    const dateOnly = new Date(
      Date.UTC(startAt.getFullYear(), startAt.getMonth(), startAt.getDate()),
    );

    const [windows, exceptions] = await Promise.all([
      this.prisma.availabilityWindow.findMany({ where: { tenantId, dayOfWeek } }),
      this.prisma.availabilityException.findMany({
        where: { tenantId, date: dateOnly },
      }),
    ]);

    const blocked = exceptions.find((e) => e.type === 'BLOCKED');
    if (blocked) {
      const within =
        blocked.startTime && blocked.endTime
          ? overlap(startTimeStr, endTimeStr, blocked.startTime, blocked.endTime)
          : true;
      if (within) throw new BadRequestException('Ese dia esta bloqueado');
    }

    const extras = exceptions.filter((e) => e.type === 'EXTRA');
    const candidates = [
      ...windows.map((w) => ({ start: w.startTime, end: w.endTime })),
      ...extras.flatMap((e) =>
        e.startTime && e.endTime ? [{ start: e.startTime, end: e.endTime }] : [],
      ),
    ];
    if (candidates.length === 0) {
      // No windows configured: skip check (treat as always-on).
      return;
    }
    const fits = candidates.some(
      (c) => startTimeStr >= c.start && endTimeStr <= c.end,
    );
    if (!fits) {
      throw new BadRequestException('Esa hora esta fuera de tu horario disponible');
    }
  }
}

function toHHmm(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}
