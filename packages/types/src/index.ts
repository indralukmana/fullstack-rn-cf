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

export const BillingIntervalSchema = z.enum(["monthly", "yearly"]);
export const BillingGrantStatusSchema = z.enum(["active", "grace_period", "revoked", "expired"]);

export const BillingStatusResponseSchema = z
  .object({
    entitlement: z.literal("pro"),
    hasAccess: z.boolean(),
    status: BillingGrantStatusSchema,
    expiresAt: z.iso.datetime().nullable(),
    grants: z.array(
      z.object({
        provider: z.enum(["stripe", "revenuecat"]),
        status: BillingGrantStatusSchema,
        interval: BillingIntervalSchema,
        expiresAt: z.iso.datetime().nullable(),
        managementUrl: z.url().nullable(),
      }),
    ),
  })
  .openapi("BillingStatusResponse");

export const CreateCheckoutRequestSchema = z
  .object({
    interval: BillingIntervalSchema,
  })
  .openapi("CreateCheckoutRequest");

export const BillingUrlResponseSchema = z
  .object({
    url: z.url(),
  })
  .openapi("BillingUrlResponse");

export const ReconciliationResponseSchema = z
  .object({
    accepted: z.literal(true),
  })
  .openapi("ReconciliationResponse");

export type BillingInterval = z.infer<typeof BillingIntervalSchema>;
export type BillingStatusResponse = z.infer<typeof BillingStatusResponseSchema>;
export type CreateCheckoutRequest = z.infer<typeof CreateCheckoutRequestSchema>;
export type BillingUrlResponse = z.infer<typeof BillingUrlResponseSchema>;

export const AccountExportResponseSchema = z
  .object({
    exportedAt: z.iso.datetime(),
    account: z.object({
      id: z.string(),
      name: z.string(),
      email: z.email(),
      createdAt: z.iso.datetime(),
    }),
    memberships: z.array(
      z.object({
        organizationId: z.string(),
        role: OrganizationRoleSchema,
      }),
    ),
    billingGrants: z.array(
      z.object({
        provider: z.enum(["stripe", "revenuecat"]),
        productId: z.string(),
        interval: BillingIntervalSchema,
        status: BillingGrantStatusSchema,
        expiresAt: z.iso.datetime().nullable(),
      }),
    ),
  })
  .openapi("AccountExportResponse");

export const AccountDeletedResponseSchema = z
  .object({
    deleted: z.literal(true),
  })
  .openapi("AccountDeletedResponse");

export const DeleteAccountRequestSchema = z
  .object({
    confirmation: z.literal("DELETE"),
  })
  .openapi("DeleteAccountRequest");

export type AccountExportResponse = z.infer<typeof AccountExportResponseSchema>;
export type AccountDeletedResponse = z.infer<typeof AccountDeletedResponseSchema>;

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "unauthorized" }),
    message: z.string().openapi({ example: "Authentication required" }),
  })
  .openapi("ErrorResponse");

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
