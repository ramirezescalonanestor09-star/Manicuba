import { z } from 'zod';

export const clientCreateSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  notesPrivate: z.string().max(2000).optional(),
  allergies: z.string().max(500).optional(),
  preferences: z.string().max(500).optional(),
});

export const clientUpdateSchema = clientCreateSchema.partial();

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
