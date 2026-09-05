import { UserStatus } from "@modules/users/domain/entities/User.js";
import z from "zod"

export const GetAttachmentsSchema = z.object({
    id: z.uuid().optional(),
    enabled: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
    status: z.enum(UserStatus).optional(),
    uploadedById:z.uuid().optional(),

    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    search: z.string().min(4).max(150).optional(),
    sortBy:z.string().optional(),
    sortDirection:z.enum(["asc","desc"]).optional(),
});