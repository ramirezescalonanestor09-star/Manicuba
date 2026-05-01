import { BadRequestException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

type AnyFn = (...args: unknown[]) => unknown;

function makePrisma(overrides: Partial<{
  appointmentFindMany: AnyFn;
  windowFindMany: AnyFn;
  exceptionFindMany: AnyFn;
}> = {}) {
  return {
    appointment: {
      findMany: overrides.appointmentFindMany ?? (async () => []),
    },
    availabilityWindow: {
      findMany: overrides.windowFindMany ?? (async () => []),
    },
    availabilityException: {
      findMany: overrides.exceptionFindMany ?? (async () => []),
    },
  } as never;
}

describe('AvailabilityService.assertSlotFree', () => {
  it('rechaza si endAt <= startAt', async () => {
    const svc = new AvailabilityService(makePrisma());
    const start = new Date('2030-01-01T10:00:00Z');
    await expect(svc.assertSlotFree('t1', start, start)).rejects.toThrow(BadRequestException);
  });

  it('rechaza si hay solape con cita CONFIRMED', async () => {
    const svc = new AvailabilityService(
      makePrisma({
        appointmentFindMany: async () => [
          {
            id: 'a1',
            startAt: new Date('2030-01-01T09:30:00Z'),
            endAt: new Date('2030-01-01T10:30:00Z'),
          },
        ],
      }),
    );
    await expect(
      svc.assertSlotFree(
        't1',
        new Date('2030-01-01T10:00:00Z'),
        new Date('2030-01-01T11:00:00Z'),
      ),
    ).rejects.toThrow('Ya existe una cita');
  });

  it('permite el slot si no hay conflictos ni ventanas configuradas', async () => {
    const svc = new AvailabilityService(makePrisma());
    await expect(
      svc.assertSlotFree(
        't1',
        new Date('2030-01-01T10:00:00Z'),
        new Date('2030-01-01T11:00:00Z'),
      ),
    ).resolves.toBeUndefined();
  });

  it('rechaza si esta fuera de las ventanas', async () => {
    // El 2030-01-01 fue martes (dayOfWeek=2). Manicuri solo abre 09:00-12:00.
    const svc = new AvailabilityService(
      makePrisma({
        windowFindMany: async () => [
          { id: 'w1', dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
        ],
      }),
    );
    const start = new Date(2030, 0, 1, 13, 0);
    const end = new Date(2030, 0, 1, 14, 0);
    await expect(svc.assertSlotFree('t1', start, end)).rejects.toThrow('horario disponible');
  });

  it('respeta excepciones BLOCKED del dia', async () => {
    const svc = new AvailabilityService(
      makePrisma({
        windowFindMany: async () => [
          { id: 'w1', dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        ],
        exceptionFindMany: async () => [
          { id: 'e1', type: 'BLOCKED', startTime: null, endTime: null },
        ],
      }),
    );
    const start = new Date(2030, 0, 1, 10, 0);
    const end = new Date(2030, 0, 1, 11, 0);
    await expect(svc.assertSlotFree('t1', start, end)).rejects.toThrow('bloqueado');
  });

  it('ignora una cita propia cuando ignoreAppointmentId coincide', async () => {
    const svc = new AvailabilityService(
      makePrisma({
        appointmentFindMany: async ({ where }: { where: { id?: { not: string } } }) => {
          // El servicio pasa `id: { not: ignoreAppointmentId }` cuando se especifica.
          if (where.id?.not === 'self') return [];
          return [
            {
              id: 'self',
              startAt: new Date('2030-01-01T09:30:00Z'),
              endAt: new Date('2030-01-01T10:30:00Z'),
            },
          ];
        },
      }),
    );
    await expect(
      svc.assertSlotFree(
        't1',
        new Date('2030-01-01T10:00:00Z'),
        new Date('2030-01-01T11:00:00Z'),
        'self',
      ),
    ).resolves.toBeUndefined();
  });
});
