import { z } from 'zod';

export const appointmentCreateSchema = z
  .object({
    clientId: z.string(),
    serviceId: z.string().optional(),
    requestId: z.string().optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    priceFinal: z.number().nonnegative().optional(),
    currency: z.enum(['CUP', 'MLC', 'USD']).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: 'endAt debe ser despues de startAt',
    path: ['endAt'],
  });

export const appointmentUpdateSchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
  priceFinal: z.number().nonnegative().optional(),
  currency: z.enum(['CUP', 'MLC', 'USD']).optional(),
  notes: z.string().max(2000).optional(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
