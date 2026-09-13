import { ZodType } from "zod";

export interface HandlerDescriptor{
    readonly name?: string;
    readonly request?: ZodType;
    readonly permissions?: string[];
    readonly authenticated?: boolean;
    readonly transaction?: boolean;
    readonly idempotent?: boolean;

}