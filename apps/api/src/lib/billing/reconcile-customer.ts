import type { Database } from "../../db/client";
import type { AppBindings } from "../config";

import { getRuntimeConfig } from "../config";
import { getBillingCatalog } from "./catalog";
import { projectProviderGrants } from "./project-grants";
import { retrieveRevenueCatGrants } from "./providers/revenuecat";
import { listStripeCustomerGrants } from "./providers/stripe";

type BillingCustomerTarget = {
  subjectType: "user" | "organization";
  subjectId: string;
  provider: "stripe" | "revenuecat";
  providerCustomerId: string;
};

export async function reconcileBillingCustomer(
  db: Database,
  env: AppBindings,
  customer: BillingCustomerTarget,
): Promise<void> {
  if (customer.subjectType !== "user") {
    return;
  }

  const grants =
    customer.provider === "stripe"
      ? await listStripeCustomerGrants(env, customer.providerCustomerId)
      : await retrieveRevenueCatGrants(env, customer.subjectId);
  const providerEnvironment = getRuntimeConfig(env).isProduction ? "production" : "sandbox";

  await projectProviderGrants(db, {
    userId: customer.subjectId,
    provider: customer.provider,
    providerEnvironment,
    entitlementKey: getBillingCatalog(env).entitlementKey,
    grants: grants.filter((grant) => grant.providerEnvironment === providerEnvironment),
    completeSnapshot: true,
  });
}
