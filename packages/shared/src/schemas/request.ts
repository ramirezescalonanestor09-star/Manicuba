import { z } from 'zod';

export const publicRequestCreateSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  description: z.string().min(5).max(2000),
  allergiesNote: z.string().max(500).optional(),
  budgetEstimate: z.number().nonnegative().optional(),
  preferredCurrency: z.enum(['CUP', 'MLC', 'USD']).optional(),
  requestedSlot: z
    .string()
    .datetime()
    .refine((s) => new Date(s).getTime() > Date.now() - 60_000, {
      message: 'La fecha solicitada no puede estar en el pasado',
    })
    .optional(),
  serviceId: z.string().optional(),
  preferredChannel: z.enum(['WHATSAPP', 'TELEGRAM', 'EMAIL', 'SMS', 'INAPP']).optional(),
  consentContact: z.boolean().refine((v) => v === true, 'Debes aceptar el contacto'),
});

export const requestStatusUpdateSchema = z.object({
  status: z.enum(['NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
});

export type PublicRequestCreateInput = z.infer<typeof publicRequestCreateSchema>;
