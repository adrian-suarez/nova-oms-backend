import { z } from "zod";

export const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(4).max(15)
});

export type LoginRequestSchema = z.infer<typeof LoginSchema>;