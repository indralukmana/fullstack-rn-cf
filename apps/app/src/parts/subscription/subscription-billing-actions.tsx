import { Platform, View } from "react-native";

import { Button, EmptyState } from "@/components/ui";
import { restoreNativePurchases, type NativePackage } from "@/lib/billing/revenuecat";

import type { SubscriptionScreenState } from "./use-subscription-screen";

type SubscriptionBillingActionsProps = Pick<
  SubscriptionScreenState,
  | "canManageBilling"
  | "status"
  | "nativePackages"
  | "pendingAction"
  | "error"
  | "run"
  | "refreshStatus"
  | "startWebCheckout"
  | "buyNative"
  | "manageSubscription"
>;

export function SubscriptionBillingActions({
  canManageBilling,
  status,
  nativePackages,
  pendingAction,
  error,
  run,
  refreshStatus,
  startWebCheckout,
  buyNative,
  manageSubscription,
}: SubscriptionBillingActionsProps) {
  return (
    <View className="gap-3">
      {canManageBilling ? (
        <>
          {status?.hasAccess ? (
            <Button
              disabled={Boolean(pendingAction)}
              label="Manage subscription"
              onPress={() => run("manage", manageSubscription)}
            />
          ) : Platform.OS === "web" ? (
            (["monthly", "yearly"] as const).map((interval) => (
              <Button
                key={interval}
                disabled={Boolean(pendingAction)}
                label={`Choose ${interval}`}
                onPress={() => run(interval, () => startWebCheckout(interval))}
              />
            ))
          ) : nativePackages.length === 0 ? (
            <EmptyState
              description={
                error
                  ? "Store offerings could not be loaded. Check your network or RevenueCat configuration, then refresh."
                  : "No store packages are available yet. Refresh after the RevenueCat offering is configured."
              }
              title="No packages available"
            />
          ) : (
            <>
              {nativePackages.map((item: NativePackage) => (
                <Button
                  key={item.id}
                  disabled={Boolean(pendingAction)}
                  label={`${item.interval} · ${item.price}`}
                  onPress={() => run(item.id, () => buyNative(item))}
                />
              ))}
              <Button
                disabled={Boolean(pendingAction)}
                label="Restore purchases"
                onPress={() =>
                  run("restore", async () => {
                    await restoreNativePurchases();
                    await refreshStatus();
                  })
                }
                variant="secondary"
              />
            </>
          )}

          <Button
            disabled={Boolean(pendingAction)}
            label="Refresh subscription"
            onPress={() => run("refresh", refreshStatus)}
            variant="secondary"
          />
        </>
      ) : (
        <EmptyState
          description="Ask an organization owner or admin if you need billing changes. You can still refresh status below."
          title="Members cannot manage billing"
        />
      )}

      {!canManageBilling ? (
        <Button
          disabled={Boolean(pendingAction)}
          label="Refresh subscription"
          onPress={() => run("refresh", refreshStatus)}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}
