export type NativePackage = {
  id: string;
  interval: "monthly" | "yearly";
  price: string;
};

function nativeOnly(): never {
  throw new Error("RevenueCat purchases are available only in native builds");
}

export function configureNativeBilling(_organizationId: string): Promise<void> {
  return nativeOnly();
}

export function clearNativeBillingIdentity(): Promise<void> {
  return Promise.resolve();
}

export function getNativePackages(): Promise<NativePackage[]> {
  return nativeOnly();
}

export function purchaseNativePackage(_packageId: string): Promise<void> {
  return nativeOnly();
}

export function restoreNativePurchases(): Promise<void> {
  return nativeOnly();
}

export function presentNativeCustomerCenter(): Promise<void> {
  return nativeOnly();
}
