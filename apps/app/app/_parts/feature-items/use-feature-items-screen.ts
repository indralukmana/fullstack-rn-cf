import {
  useCreateFeatureItem,
  useListFeatureItems,
  getListFeatureItemsQueryKey,
} from "@rn-cf/api-client";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function useFeatureItemsScreen(featureKey: string) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const activeOrganization = authClient.useActiveOrganization();
  const listQuery = useListFeatureItems(featureKey, {
    query: {
      queryKey: getListFeatureItemsQueryKey(featureKey),
      enabled: Boolean(session?.user && activeOrganization.data?.id),
    },
  });
  const createMutation = useCreateFeatureItem();
  const [titleValue, setTitleValue] = useState("");
  const [bodyValue, setBodyValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const items =
    listQuery.data?.data && "items" in listQuery.data.data ? listQuery.data.data.items : [];

  async function onCreate() {
    const titleText = titleValue.trim();
    if (!titleText) {
      setError("Title is required.");
      return;
    }
    setError(null);
    try {
      await createMutation.mutateAsync({
        featureKey,
        data: { title: titleText, body: bodyValue.trim() || undefined },
      });
      setTitleValue("");
      setBodyValue("");
      await listQuery.refetch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create item.");
    }
  }

  return {
    session,
    sessionPending,
    activeOrganization,
    listQuery,
    createMutation,
    titleValue,
    setTitleValue,
    bodyValue,
    setBodyValue,
    error,
    items,
    onCreate,
  };
}

export type FeatureItemsScreenState = ReturnType<typeof useFeatureItemsScreen>;
