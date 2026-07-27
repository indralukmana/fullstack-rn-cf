import { createMiddleware } from "hono/factory";

import type { AuthEnv } from "../lib/better-auth";
import type { AuthVariables } from "./require-auth";
import type { OrganizationVariables } from "./require-organization";

import { createDb } from "../db/client";
import {
  subjectHasEntitlement,
  type EntitlementSubjectType,
} from "../lib/billing/entitlement-access";
import { getRuntimeConfig } from "../lib/config";

export type RequireEntitlementOptions = {
  /** Capability key. Defaults to BILLING_ENTITLEMENT_KEY from runtime config. */
  key?: string;
  /**
   * Who owns the Entitlement row.
   * - `user` (default): matches current launchpad billing projection
   * - `organization`: requires `requireOrganization` upstream; ADR 0001 target
   * - `auto`: organization when org context is set, otherwise user
   */
  subject?: EntitlementSubjectType | "auto";
};

function resolveOptions(
  options?: string | RequireEntitlementOptions,
): Required<Pick<RequireEntitlementOptions, "subject">> & { key?: string } {
  if (typeof options === "string") {
    return { key: options, subject: "user" };
  }
  return {
    key: options?.key,
    subject: options?.subject ?? "user",
  };
}

/**
 * Fail closed when the subject lacks an active/grace Entitlement.
 * Compose after `requireAuth`. For `subject: "organization" | "auto"` with an org, also compose
 * `requireOrganization` so `c.var.organization` is set.
 */
export function requireEntitlement(options?: string | RequireEntitlementOptions) {
  const resolved = resolveOptions(options);

  return createMiddleware<{
    Bindings: AuthEnv;
    Variables: AuthVariables & Partial<OrganizationVariables>;
  }>(async (c, next) => {
    const config = getRuntimeConfig(c.env);
    const key = resolved.key?.trim() || config.billingEntitlementKey;
    const organizationId = c.var.organization?.id;

    let subjectType: EntitlementSubjectType = "user";
    let subjectId = c.var.user.id;

    if (resolved.subject === "organization") {
      if (!organizationId) {
        return c.json(
          {
            error: "organization_required",
            message: "Select an organization before using this resource",
          },
          400,
        );
      }
      subjectType = "organization";
      subjectId = organizationId;
    } else if (resolved.subject === "auto" && organizationId) {
      subjectType = "organization";
      subjectId = organizationId;
    }

    const allowed = await subjectHasEntitlement(createDb(c.env.DB), {
      subjectType,
      subjectId,
      key,
    });

    if (!allowed) {
      return c.json(
        {
          error: "entitlement_required",
          message: `The ${key} entitlement is required`,
        },
        403,
      );
    }

    return next();
  });
}
