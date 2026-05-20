import { z } from 'zod';

const nonNegative = z.number().nonnegative();

export const serviceCreateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(1000).optional(),
  durationMin: z.number().int().min(5).max(600),
  priceCUP: nonNegative.optional(),
  priceMLC: nonNegative.optional(),
  priceUSD: nonNegative.optional(),
  active: z.boolean().default(true),
  coverImage: z.string().url().optional(),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
