import { UserStatus } from "@modules/users/domain/entities/User.js";
import z from "zod"

export const UpdateUserSchema = z.object({
    id: z.uuid(),
    firstName: z.string().min(2).max(15).optional(),
    lastName: z.string().min(2).max(15).optional(),
    enabled: z.boolean().optional(),
    status: z.enum(UserStatus).optional(),
    rolesIds:z.array(z.uuid()).optional(),
    version: z.int()
});

export type UpdateUserRequestSchema = z.infer<typeof UpdateUserSchema>;