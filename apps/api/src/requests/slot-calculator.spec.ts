import { computeAppointmentSlot } from './slot-calculator';

describe('computeAppointmentSlot', () => {
  const now = new Date('2030-01-01T10:00:00.000Z');

  it('usa requestedSlot cuando esta al menos 1h en el futuro', () => {
    const requested = new Date('2030-01-02T15:00:00.000Z');
    const slot = computeAppointmentSlot({
      requestedSlot: requested,
      serviceDurationMin: 90,
      now,
    });
    expect(slot.start.toISOString()).toBe(requested.toISOString());
    expect(slot.end.getTime() - slot.start.getTime()).toBe(90 * 60 * 1000);
    expect(slot.durationMin).toBe(90);
  });

  it('cae a now+1h cuando requestedSlot es null', () => {
    const slot = computeAppointmentSlot({
      requestedSlot: null,
      serviceDurationMin: null,
      now,
    });
    expect(slot.start.getTime()).toBe(now.getTime() + 60 * 60 * 1000);
    expect(slot.durationMin).toBe(60);
  });

  it('cae a now+1h cuando requestedSlot esta en el pasado', () => {
    const past = new Date('2029-12-31T08:00:00.000Z');
    const slot = computeAppointmentSlot({
      requestedSlot: past,
      serviceDurationMin: 45,
      now,
    });
    expect(slot.start.getTime()).toBe(now.getTime() + 60 * 60 * 1000);
    expect(slot.durationMin).toBe(45);
  });

  it('cae a now+1h cuando requestedSlot esta a menos de 1h', () => {
    const tooSoon = new Date('2030-01-01T10:30:00.000Z');
    const slot = computeAppointmentSlot({
      requestedSlot: tooSoon,
      serviceDurationMin: 30,
      now,
    });
    expect(slot.start.getTime()).toBe(now.getTime() + 60 * 60 * 1000);
  });

  it('usa duracion por defecto de 60 cuando no hay servicio', () => {
    const slot = computeAppointmentSlot({
      requestedSlot: new Date('2030-02-01T10:00:00.000Z'),
      serviceDurationMin: null,
      now,
    });
    expect(slot.durationMin).toBe(60);
    expect(slot.end.getTime() - slot.start.getTime()).toBe(60 * 60 * 1000);
  });
});
