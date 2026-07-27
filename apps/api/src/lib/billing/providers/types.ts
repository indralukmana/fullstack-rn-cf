import type { BillingInterval, BillingPlatform } from "../catalog";

export type ProviderEnvironment = "sandbox" | "production";
export type GrantStatus = "active" | "grace_period" | "revoked" | "expired";

export type NormalizedProviderGrant = {
  provider: "stripe" | "revenuecat";
  providerEnvironment: ProviderEnvironment;
  providerCustomerId: string;
  providerGrantId: string;
  /** Organization id — the commercial billing subject (ADR 0001 / 0003). */
  subjectId: string;
  productId: string;
  interval: BillingInterval;
  status: GrantStatus;
  occurredAt: Date;
  expiresAt: Date | null;
  managementUrl: string | null;
  lastProviderState: string;
  priceId?: string;
  platform?: BillingPlatform;
};
