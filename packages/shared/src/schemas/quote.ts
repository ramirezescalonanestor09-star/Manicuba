import { z } from 'zod';

export const quoteCreateSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['CUP', 'MLC', 'USD']),
  message: z.string().max(2000).optional(),
  validUntil: z.string().datetime().optional(),
});

export const quoteDecisionSchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT']),
  note: z.string().max(500).optional(),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
export type QuoteDecisionInput = z.infer<typeof quoteDecisionSchema>;
