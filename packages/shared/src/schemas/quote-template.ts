import { z } from 'zod';

export const quoteTemplateSchema = z.object({
  name: z.string().min(2).max(60),
  body: z.string().min(2).max(2000),
});

export type QuoteTemplateInput = z.infer<typeof quoteTemplateSchema>;
