import { z } from 'zod';

export const messageCreateSchema = z.object({
  body: z.string().min(1).max(2000),
});

export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
