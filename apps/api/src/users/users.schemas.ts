import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .describe('Full name of the user.'),
  email: z.email().describe('Email address; unique across the API.'),
  password: z
    .string()
    .min(8)
    .max(128)
    .describe('Password with 8 to 128 characters. It is never returned.'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
