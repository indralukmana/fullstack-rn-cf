import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

import { retrieveRevenueCatGrants } from "../../src/lib/billing/providers/revenuecat";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RevenueCat authoritative adapter", () => {
  it("normalizes billing grace and ignores products outside the Pro catalog", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            subscriber: {
              management_url: "https://play.google.com/store/account/subscriptions",
              subscriptions: {
                [env.REVENUECAT_ANDROID_PRODUCT_MONTHLY]: {
                  expires_date: "2026-07-25T00:00:00.000Z",
                  grace_period_expires_date: "2099-08-01T00:00:00.000Z",
                  billing_issues_detected_at: "2026-07-25T00:00:00.000Z",
                  purchase_date: "2026-07-01T00:00:00.000Z",
                  store_transaction_id: "GPA.test",
                  is_sandbox: false,
                },
                unrelated_product: {
                  expires_date: "2099-08-01T00:00:00.000Z",
                  purchase_date: "2026-07-01T00:00:00.000Z",
                  is_sandbox: false,
                },
              },
            },
          }),
          { status: 200 },
        );
      }),
    );

    await expect(retrieveRevenueCatGrants(env, "user_123")).resolves.toEqual([
      expect.objectContaining({
        provider: "revenuecat",
        providerEnvironment: "production",
        productId: env.REVENUECAT_ANDROID_PRODUCT_MONTHLY,
        interval: "monthly",
        status: "grace_period",
      }),
    ]);
  });

  it("fails closed on a malformed provider response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );
    await expect(retrieveRevenueCatGrants(env, "user_123")).rejects.toThrow(
      "invalid subscriber response",
    );
  });
});
