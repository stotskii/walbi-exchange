import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {QueryClientProvider} from "@tanstack/react-query";
import {RouterProvider, createRouter} from "@tanstack/react-router";
import {registerSW} from "virtual:pwa-register";

import {queryClient, startPersistedCache} from "./lib/cache/queryClient";
import {routeTree} from "./routeTree.gen";
import "./index.css";

// Hydrate persisted cache from IndexedDB before React renders so the first
// frame can already use stale data.
startPersistedCache();

const router = createRouter({
  routeTree,
  defaultPreload: "intent", // prefetch on hover/focus — feels instant
  defaultPreloadStaleTime: 30_000,
  context: {queryClient},
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Register the Service Worker — auto-update once new build ships.
registerSW({immediate: true});

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
