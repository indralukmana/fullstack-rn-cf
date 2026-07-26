import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { routeFromIncomingUrl } from "@/lib/deep-links";

/** Native cold-start and runtime URL handler for auth/org deep links. */
export function DeepLinkHandler() {
  useEffect(() => {
    if (Platform.OS === "web") {
      return undefined;
    }

    function open(url: string) {
      const href = routeFromIncomingUrl(url);
      if (href) {
        router.push(href);
      }
    }

    void Linking.getInitialURL().then((url) => {
      if (url) {
        open(url);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      open(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
