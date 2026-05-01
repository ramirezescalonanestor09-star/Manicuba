import { z } from 'zod';

export const registerSchema = z.object({
  businessName: z.string().min(2).max(80),
  ownerName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(128),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minusculas, numeros y guiones'),
  defaultCurrency: z.enum(['CUP', 'MLC', 'USD']).default('CUP'),
  timezone: z.string().default('America/Havana'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
