import z from "zod"

export const CreateUserSchema = z.object({
    email: z.email(),
    password: z.string().min(4).max(15),
    firstName: z.string().min(2).max(15),
    lastName: z.string().min(2).max(15),
    rolesIds:z.array(z.string()).nonempty().optional()
});

export type CreateUserRequestSchema = z.infer<typeof CreateUserSchema>;