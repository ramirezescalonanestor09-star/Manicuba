import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
});

export const availabilityExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  type: z.enum(['BLOCKED', 'EXTRA']),
  reason: z.string().max(200).optional(),
});

export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;
export type AvailabilityExceptionInput = z.infer<typeof availabilityExceptionSchema>;
