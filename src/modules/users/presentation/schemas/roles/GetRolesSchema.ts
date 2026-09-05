import z from "zod"

export const GetRolesSchema = z.object({
    id: z.uuid().optional(),
    enabled: z.enum(["true", "false"]).transform((val) => val === "true").optional(),

    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    search: z.string().min(4).max(15).optional(),
    sortBy:z.string().optional(),
    sortDirection:z.enum(["asc","desc"]).optional(),
});