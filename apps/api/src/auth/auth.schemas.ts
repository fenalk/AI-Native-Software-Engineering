import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email().describe('Email address of the user.'),
  password: z.string().min(1).describe('Password of the user.'),
});

export type SignInInput = z.infer<typeof signInSchema>;
