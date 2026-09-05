import z from "zod"

export const CreateRoleSchema = z.object({
    name: z.string().min(2).max(15),
    description: z.string().min(2).max(15),
    permissionsIds:z.array(z.string()).nonempty().optional()
});

export type CreateRoleRequestSchema = z.infer<typeof CreateRoleSchema>;