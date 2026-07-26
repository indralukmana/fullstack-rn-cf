export type NativePackage = {
  id: string;
  interval: "monthly" | "yearly";
  price: string;
};

function nativeOnly(): never {
  throw new Error("RevenueCat purchases are available only in native builds");
}

export async function configureNativeBilling(_userId: string): Promise<void> {
  nativeOnly();
}

export async function clearNativeBillingIdentity(): Promise<void> {
  return Promise.resolve();
}

export async function getNativePackages(): Promise<NativePackage[]> {
  return nativeOnly();
}

export async function purchaseNativePackage(_packageId: string): Promise<void> {
  nativeOnly();
}

export async function restoreNativePurchases(): Promise<void> {
  nativeOnly();
}

export async function presentNativeCustomerCenter(): Promise<void> {
  nativeOnly();
}
