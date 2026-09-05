import z from "zod"

export const UpdateRoleSchema = z.object({
    id: z.uuid(),
    name: z.string().min(2).max(15).optional(),
    description: z.string().min(2).max(15).optional(),
    enabled: z.boolean().optional(),
    permissionsIds:z.array(z.uuid()).optional(),
    version: z.int()
});

export type UpdateRoleRequestSchema = z.infer<typeof UpdateRoleSchema>;