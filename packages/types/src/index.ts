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

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "Unauthorized" }),
  })
  .openapi("ErrorResponse");

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
