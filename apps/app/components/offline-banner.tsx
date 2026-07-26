import * as Network from "expo-network";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

function isOfflineState(state: Network.NetworkState): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function useIsOffline() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;

    void Network.getNetworkStateAsync().then((state) => {
      if (active) {
        setOffline(isOfflineState(state));
      }
    });

    const subscription = Network.addNetworkStateListener((state) => {
      setOffline(isOfflineState(state));
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return offline;
}

export function OfflineBanner() {
  const offline = useIsOffline();
  if (!offline) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      className="border-b border-warning-border bg-warning-canvas px-4 py-2.5"
    >
      <Text className="text-center text-sm font-medium text-warning-foreground">
        You are offline. Some actions may fail until you reconnect.
      </Text>
    </View>
  );
}
