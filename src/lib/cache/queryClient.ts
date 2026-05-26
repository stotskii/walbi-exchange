import {QueryClient} from "@tanstack/react-query";
import {persistQueryClient} from "@tanstack/react-query-persist-client";
import {createAsyncStoragePersister} from "@tanstack/query-async-storage-persister";
import {get, set, del} from "idb-keyval";

/**
 * TanStack Query client tuned for aggressive caching.
 *
 * Strategy:
 *   • stale-while-revalidate by default — cached data is shown instantly, then
 *     re-fetched in the background
 *   • per-endpoint staleTime overrides (set in individual `useQuery` calls)
 *   • IndexedDB persistence across page reloads via the async-storage persister
 *   • garbage-collect after 24h of inactivity
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // serve cache immediately; refresh in background if older than 30s
      staleTime: 30_000,
      // keep in memory for 5 min after last component unmounts
      gcTime: 5 * 60_000,
      retry: (failureCount, error: unknown) => {
        // don't retry 4xx
        const status = (error as {status?: number})?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: "always",
      refetchOnReconnect: "always",
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

// IndexedDB-backed persistence. Survives reloads, browser restart, offline.
const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key).then((v) => (v as string) ?? null),
    setItem: (key, value) => set(key, value).then(() => undefined),
    removeItem: (key) => del(key),
  },
  key: "walbi-exchange-cache",
  // throttle writes to avoid blocking the main thread
  throttleTime: 1000,
});

export function startPersistedCache(): void {
  persistQueryClient({
    queryClient,
    persister: idbPersister,
    // keep persisted snapshot for 24h
    maxAge: 24 * 60 * 60 * 1000,
    // bump this on breaking cache changes
    buster: "v1",
    dehydrateOptions: {
      // don't persist mutations or stale-but-loading queries
      shouldDehydrateQuery: (q) => q.state.status === "success",
    },
  });
}
