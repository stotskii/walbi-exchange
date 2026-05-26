import {createRootRouteWithContext, Outlet} from "@tanstack/react-router";
import type {QueryClient} from "@tanstack/react-query";

import {AppShell} from "../components/Shell/AppShell";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
