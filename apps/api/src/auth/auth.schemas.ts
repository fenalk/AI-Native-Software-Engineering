import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email().describe('Email address of the user.'),
  // Same ceiling as `createUserSchema`: without it a 100 KB password reaches
  // `scrypt` on every attempt, including attempts for unknown emails.
  password: z.string().min(1).max(128).describe('Password of the user.'),
});

export type SignInInput = z.infer<typeof signInSchema>;
