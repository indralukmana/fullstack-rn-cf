import { z } from "@hono/zod-openapi";

export const HealthResponseSchema = z
  .object({
    status: z.literal("ok").openapi({ example: "ok" }),
    service: z.string().openapi({ example: "rn-cf-api" }),
  })
  .openapi("HealthResponse");

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const MeUserSchema = z
  .object({
    id: z.string().openapi({ example: "user_123" }),
    name: z.string().openapi({ example: "Ada Lovelace" }),
    email: z.email().openapi({ example: "ada@example.com" }),
  })
  .openapi("MeUser");

export const MeResponseSchema = z
  .object({
    user: MeUserSchema.nullable(),
  })
  .openapi("MeResponse");

export type MeUser = z.infer<typeof MeUserSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const OrganizationRoleSchema = z.enum(["owner", "admin", "member"]);

export const OrganizationContextResponseSchema = z
  .object({
    organization: z.object({
      id: z.string().openapi({ example: "org_123" }),
      role: OrganizationRoleSchema,
    }),
  })
  .openapi("OrganizationContextResponse");

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
export type OrganizationContextResponse = z.infer<typeof OrganizationContextResponseSchema>;

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "unauthorized" }),
    message: z.string().openapi({ example: "Authentication required" }),
  })
  .openapi("ErrorResponse");

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
