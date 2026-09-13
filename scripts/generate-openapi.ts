// scripts/generate-openapi.ts
//
// Genera docs/openapi.json a partir de los mismos Zod schemas que usa
// RequestValidationBehavior en runtime (src/shared/application/pipelines/behaviors/
// RequestValidationBehavior.ts) — no hay una segunda fuente de verdad de request
// que mantener sincronizada a mano; si un schema cambia, el spec generado cambia con él.
//
// Documenta solo requests (path/query/body) y códigos de respuesta — los DTO de
// respuesta son interfaces TypeScript planas, sin Zod schema real detrás, así que
// documentarlos exigiría escribir y mantener a mano un segundo artefacto separado
// del código real. Se prefirió no hacerlo antes que tener una doc que puede
// desincronizarse en silencio.
//
// Uso: pnpm docs:openapi

import { writeFileSync } from "node:fs";
import { z } from "zod";
import { createDocument, type ZodOpenApiPathsObject, type ZodOpenApiOperationObject } from "zod-openapi";

import { IdSchema } from "@shared/presentation/schemas/IdSchema.js";
import { LoginSchema } from "@modules/auth/presentation/schemas/AuthSchema.js";
import { CreateUserSchema } from "@modules/users/presentation/schemas/users/CreateUserSchema.js";
import { UpdateUserSchema } from "@modules/users/presentation/schemas/users/UpdateUserSchema.js";
import { GetUsersSchema } from "@modules/users/presentation/schemas/users/GetUsersSchema.js";
import { CreateRoleSchema } from "@modules/users/presentation/schemas/roles/CreateRoleSchema.js";
import { UpdateRoleSchema } from "@modules/users/presentation/schemas/roles/UpdateRoleSchema.js";
import { GetRolesSchema } from "@modules/users/presentation/schemas/roles/GetRolesSchema.js";
import { GenerateUploadUrlSchema } from "@modules/attachments/presentation/schemas/GenerateUploadUrlSchema.js";
import { GetAttachmentsSchema } from "@modules/attachments/presentation/schemas/GetAttachmentsSchema.js";

import { UsersPermissions } from "@shared/security/permissions/UserPermissions.js";
import { RolesPermissions } from "@shared/security/permissions/RolePermissions.js";
import { AttachmentsPermissions } from "@shared/security/permissions/AttachmentPermissions.js";

const errorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
});

const errorResponse = (description: string) => ({
    description,
    content: { "application/json": { schema: errorSchema } },
});

const commonErrors = {
    400: errorResponse("Error de validación de la request"),
} as const;

const authErrors = {
    ...commonErrors,
    401: errorResponse("No autenticado o token inválido/expirado"),
} as const;

function permissionErrors(...permissions: string[]) {
    return {
        ...authErrors,
        403: errorResponse(`Requiere el/los permiso(s): ${permissions.join(", ")}`),
    } as const;
}

function op(operation: ZodOpenApiOperationObject): ZodOpenApiOperationObject {
    return operation;
}

const bearerSecurity = [{ bearerAuth: [] }];

const paths: ZodOpenApiPathsObject = {
    "/health": {
        get: op({
            tags: ["Health"],
            summary: "Estado del servicio",
            responses: { 200: { description: "OK" } },
        }),
    },
    "/auth/login": {
        post: op({
            tags: ["Auth"],
            summary: "Login local (email + password)",
            requestBody: { content: { "application/json": { schema: LoginSchema } } },
            responses: { 200: { description: "OK" }, ...authErrors, 401: errorResponse("Credenciales inválidas") },
        }),
    },
    "/users/me": {
        get: op({
            tags: ["Users"],
            summary: "Usuario autenticado actual",
            security: bearerSecurity,
            responses: { 200: { description: "OK" }, ...authErrors },
        }),
    },
    "/users/{id}": {
        get: op({
            tags: ["Users"],
            summary: "Obtener usuario por id",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(UsersPermissions.READ.name), 404: errorResponse("Usuario no encontrado") },
        }),
        patch: op({
            tags: ["Users"],
            summary: "Actualizar usuario (campos parciales + roles)",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            requestBody: { content: { "application/json": { schema: UpdateUserSchema.omit({ id: true }) } } },
            responses: {
                200: { description: "OK" },
                ...permissionErrors(UsersPermissions.UPDATE.name),
                404: errorResponse("Usuario no encontrado"),
                409: errorResponse("Conflicto de versión (optimistic locking) — el recurso fue modificado desde la última lectura"),
            },
        }),
        delete: op({
            tags: ["Users"],
            summary: "Eliminar usuario",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(UsersPermissions.DELETE.name), 404: errorResponse("Usuario no encontrado") },
        }),
    },
    "/users": {
        get: op({
            tags: ["Users"],
            summary: "Listar usuarios (paginado, filtros)",
            security: bearerSecurity,
            requestParams: { query: GetUsersSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(UsersPermissions.READ.name) },
        }),
        post: op({
            tags: ["Users"],
            summary: "Crear usuario",
            security: bearerSecurity,
            requestBody: { content: { "application/json": { schema: CreateUserSchema } } },
            responses: { 200: { description: "OK" }, ...permissionErrors(UsersPermissions.CREATE.name), 409: errorResponse("El email ya existe") },
        }),
    },
    "/roles/{id}": {
        get: op({
            tags: ["Roles"],
            summary: "Obtener rol por id",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(RolesPermissions.READ.name), 404: errorResponse("Rol no encontrado") },
        }),
        patch: op({
            tags: ["Roles"],
            summary: "Actualizar rol (campos parciales + permisos)",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            requestBody: { content: { "application/json": { schema: UpdateRoleSchema.omit({ id: true }) } } },
            responses: {
                200: { description: "OK" },
                ...permissionErrors(RolesPermissions.UPDATE.name),
                404: errorResponse("Rol no encontrado"),
                409: errorResponse("Conflicto de versión (optimistic locking) — el recurso fue modificado desde la última lectura"),
            },
        }),
        delete: op({
            tags: ["Roles"],
            summary: "Eliminar rol",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(RolesPermissions.DELETE.name), 404: errorResponse("Rol no encontrado") },
        }),
    },
    "/roles": {
        get: op({
            tags: ["Roles"],
            summary: "Listar roles (paginado, filtros)",
            security: bearerSecurity,
            requestParams: { query: GetRolesSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(RolesPermissions.READ.name) },
        }),
        post: op({
            tags: ["Roles"],
            summary: "Crear rol",
            security: bearerSecurity,
            requestBody: { content: { "application/json": { schema: CreateRoleSchema } } },
            responses: { 200: { description: "OK" }, ...permissionErrors(RolesPermissions.CREATE.name), 409: errorResponse("El nombre de rol ya existe") },
        }),
    },
    "/attachments/upload": {
        post: op({
            tags: ["Attachments"],
            summary: "Generar URL prefirmada de subida",
            security: bearerSecurity,
            requestBody: { content: { "application/json": { schema: GenerateUploadUrlSchema } } },
            responses: { 200: { description: "OK" }, ...permissionErrors(AttachmentsPermissions.UPLOAD.name) },
        }),
    },
    "/attachments/{id}/download": {
        get: op({
            tags: ["Attachments"],
            summary: "Generar URL prefirmada de descarga",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(AttachmentsPermissions.DOWNLOAD.name), 404: errorResponse("Adjunto no encontrado") },
        }),
    },
    "/attachments/{id}": {
        get: op({
            tags: ["Attachments"],
            summary: "Obtener adjunto por id",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(AttachmentsPermissions.READ.name), 404: errorResponse("Adjunto no encontrado") },
        }),
        delete: op({
            tags: ["Attachments"],
            summary: "Eliminar adjunto",
            security: bearerSecurity,
            requestParams: { path: IdSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(AttachmentsPermissions.DELETE.name), 404: errorResponse("Adjunto no encontrado") },
        }),
    },
    "/attachments": {
        get: op({
            tags: ["Attachments"],
            summary: "Listar adjuntos (paginado, filtros)",
            security: bearerSecurity,
            requestParams: { query: GetAttachmentsSchema },
            responses: { 200: { description: "OK" }, ...permissionErrors(AttachmentsPermissions.READ.name) },
        }),
    },
};

const document = createDocument({
    openapi: "3.1.0",
    info: {
        title: "Nova OMS Backend API",
        version: "1.0.0-RC1",
        description:
            "Generado desde los Zod schemas reales del pipeline de request (RequestValidationBehavior) — ver README.md sección 6 y CLAUDE.md para contexto de arquitectura.",
    },
    servers: [{ url: "/v1", description: "Prefijo de versión de todas las rutas" }],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
    },
    paths,
});

writeFileSync(new URL("../docs/openapi.json", import.meta.url), JSON.stringify(document, null, 2) + "\n");

console.log("docs/openapi.json generado.");
