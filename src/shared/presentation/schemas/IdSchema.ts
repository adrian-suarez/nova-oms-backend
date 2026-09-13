import z from "zod"

export const IdSchema = z.object({
    id: z.uuid()
});

export type IdRequestSchema = z.infer<typeof IdSchema>;