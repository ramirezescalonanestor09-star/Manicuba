/**
 * Calcula el slot de la cita al aceptar una cotizacion.
 *
 * Reglas:
 * - Usa requestedSlot si fue informado y esta al menos 1 hora en el futuro.
 * - Si no, agenda en `now + 1 hora` (la manicuri puede reagendar despues).
 * - Duracion: la del servicio asociado, o 60 minutos por defecto.
 */
export interface SlotInput {
  requestedSlot: Date | null;
  serviceDurationMin: number | null;
  now?: Date;
}

export interface ComputedSlot {
  start: Date;
  end: Date;
  durationMin: number;
}

export function computeAppointmentSlot(input: SlotInput): ComputedSlot {
  const now = input.now ?? new Date();
  const durationMin = input.serviceDurationMin ?? 60;
  const earliestStart = new Date(now.getTime() + 60 * 60 * 1000);
  const start =
    input.requestedSlot && input.requestedSlot > earliestStart
      ? input.requestedSlot
      : earliestStart;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return { start, end, durationMin };
}
