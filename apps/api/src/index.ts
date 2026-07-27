import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HealthResponseSchema,
  MeResponseSchema,
  OrganizationContextResponseSchema,
} from "@rn-cf/types";
import { Scalar } from "@scalar/hono-api-reference";
import { APIError } from "better-auth";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import type { AppEnv } from "./app-env";

import { getSession } from "./lib/auth/session";
import { createAuth, type AuthEnv } from "./lib/better-auth";
import { handleBillingQueue, handleScheduledBilling } from "./lib/billing/worker-handlers";
import { getRuntimeConfig, type BillingQueueMessage } from "./lib/config";
import { clearOutboundEmails, listOutboundEmails } from "./lib/email/send";
import { initVarlockIfPresent } from "./lib/varlock-init";
import { rateLimit } from "./middleware/rate-limit";
import { requestContext } from "./middleware/request-context";
import { requireAuth } from "./middleware/require-auth";
import { requireEntitlement } from "./middleware/require-entitlement";
import { requireOrganization } from "./middleware/require-organization";
import { accountRoutes } from "./routes/account";
import { billingRoutes } from "./routes/billing";
import { billingWebhooks } from "./routes/billing-webhooks";

await initVarlockIfPresent();

export const app = new OpenAPIHono<AppEnv>();

app.use("*", requestContext);

app.onError((error, c) => {
  console.error(error);

  const config = getRuntimeConfig(c.env);
  if (config.isProduction) {
    return c.json({ error: "internal_error", message: "Internal Server Error" }, 500);
  }

  return c.json(
    {
      error: "internal_error",
      message: error instanceof Error ? error.message : "Internal Server Error",
    },
    500,
  );
});

app.use("*", async (c, next) => {
  const config = getRuntimeConfig(c.env);

  return secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "no-referrer",
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
    },
    strictTransportSecurity: config.isProduction ? "max-age=15552000; includeSubDomains" : false,
  })(c, next);
});

app.use(
  "*",
  bodyLimit({
    maxSize: 1024 * 1024,
    onError: (c) => c.json({ error: "payload_too_large", message: "Request body too large" }, 413),
  }),
);

app.use("*", async (c, next) => {
  const config = getRuntimeConfig(c.env);
  const origins = new Set(config.corsOrigins);

  return cors({
    origin: (origin) => (origin && origins.has(origin) ? origin : null),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Organization-Id"],
  })(c, next);
});

app.use("/api/auth/*", async (c, next) => {
  const config = getRuntimeConfig(c.env);
  return rateLimit({
    keyPrefix: "auth",
    windowMs: config.authRateLimitTtlMs,
    max: config.authRateLimitMax,
  })(c, next);
});

app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api/auth/") || c.req.path.startsWith("/api/webhooks/")) {
    return next();
  }

  const config = getRuntimeConfig(c.env);
  return rateLimit({
    keyPrefix: "global",
    windowMs: config.rateLimitTtlMs,
    max: config.rateLimitMax,
  })(c, next);
});

app.use("/api/webhooks/*", async (c, next) => {
  const config = getRuntimeConfig(c.env);
  return rateLimit({
    keyPrefix: "webhook",
    windowMs: config.webhookRateLimitTtlMs,
    max: config.webhookRateLimitMax,
  })(c, next);
});

app.route("/api/webhooks", billingWebhooks);
app.route("/api/billing", billingRoutes);
app.route("/api/account", accountRoutes);

app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  try {
    return await createAuth(c.env).handler(c.req.raw);
  } catch (error) {
    // better-call controls redirects/errors via thrown APIError; convert if it escapes.
    if (error instanceof APIError) {
      const headers = new Headers(error.headers);
      const location = headers.get("Location") || headers.get("location");
      if (error.statusCode >= 300 && error.statusCode < 400 && location) {
        return new Response(null, {
          status: error.statusCode,
          headers: { Location: location },
        });
      }

      return new Response(JSON.stringify(error.body ?? { message: "Request failed" }), {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(headers.entries()),
        },
      });
    }

    throw error;
  }
});

/** Dev-only outbox so local/e2e flows can read verification and reset links. */
app.get("/api/dev/mailbox", (c) => {
  const config = getRuntimeConfig(c.env);
  if (config.isProduction) {
    return c.json({ error: "not_found", message: "Not found" }, 404);
  }

  const to = c.req.query("to") ?? undefined;
  return c.json({ messages: listOutboundEmails(to) });
});

app.delete("/api/dev/mailbox", (c) => {
  const config = getRuntimeConfig(c.env);
  if (config.isProduction) {
    return c.json({ error: "not_found", message: "Not found" }, 404);
  }

  clearOutboundEmails();
  return c.json({ cleared: true });
});

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  operationId: "getHealth",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "Health check",
    },
  },
});

app.openapi(healthRoute, (c) => {
  const config = getRuntimeConfig(c.env);
  return c.json({
    status: "ok" as const,
    service: config.serviceName,
  });
});

const meRoute = createRoute({
  method: "get",
  path: "/api/me",
  operationId: "getMe",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MeResponseSchema,
        },
      },
      description: "Current authenticated user, if any",
    },
  },
});

app.openapi(meRoute, async (c) => {
  const session = await getSession(c);

  if (!session) {
    return c.json({ user: null }, 200);
  }

  return c.json(
    {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    },
    200,
  );
});

const privatePingRoute = createRoute({
  method: "get",
  path: "/api/private/ping",
  operationId: "getPrivatePing",
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "Authenticated ping",
    },
    401: {
      description: "Authentication required",
    },
  },
});

app.openapi(privatePingRoute, (c) => {
  const config = getRuntimeConfig(c.env);
  return c.json({
    status: "ok" as const,
    service: config.serviceName,
  });
});

const proPingRoute = createRoute({
  method: "get",
  path: "/api/private/pro",
  operationId: "getProPing",
  tags: ["Billing"],
  middleware: [requireAuth, requireEntitlement()] as const,
  responses: {
    200: {
      content: { "application/json": { schema: HealthResponseSchema } },
      description: "Capability protected by the Pro entitlement",
    },
    401: { description: "Authentication required" },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pro entitlement required",
    },
  },
});

app.openapi(proPingRoute, (c) => {
  const config = getRuntimeConfig(c.env);
  return c.json({ status: "ok" as const, service: config.serviceName }, 200);
});

const organizationContextRoute = createRoute({
  method: "get",
  path: "/api/private/organization",
  operationId: "getOrganizationContext",
  middleware: [requireAuth, requireOrganization] as const,
  request: {
    headers: z.object({
      "x-organization-id": z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrganizationContextResponseSchema,
        },
      },
      description: "Verified organization context for the current user",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "No organization was selected",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Authentication required",
    },
    403: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "The user is not a member of the selected organization",
    },
  },
});

app.openapi(organizationContextRoute, (c) => {
  return c.json({ organization: c.var.organization }, 200);
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "RN CF API",
    version: "0.0.1",
  },
});

app.get(
  "/scalar",
  Scalar({
    url: "/doc",
    pageTitle: "RN CF API",
  }),
);

const worker: ExportedHandler<AuthEnv, BillingQueueMessage> = {
  fetch: app.fetch,
  queue: handleBillingQueue,
  scheduled: handleScheduledBilling,
};

export default worker;
