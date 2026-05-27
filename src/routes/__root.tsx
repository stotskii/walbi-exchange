import {
  createRootRouteWithContext,
  Outlet,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type {QueryClient} from "@tanstack/react-query";

import {AppShell} from "../components/Shell/AppShell";

interface RouterContext {
  queryClient: QueryClient;
}

function RouteError({error, reset}: ErrorComponentProps) {
  return (
    <div className="mx-auto max-w-xl space-y-3 px-5 py-10">
      <div className="eyebrow">Ошибка маршрута</div>
      <h1 className="text-[24px] font-medium tracking-tight">Что-то пошло не так</h1>
      <pre className="mono whitespace-pre-wrap rounded-sm border border-danger/30 bg-danger-soft p-3 text-[12px] text-danger">
        {String(error?.message ?? error)}
      </pre>
      {error?.stack ? (
        <details className="rounded-sm border border-separator p-2">
          <summary className="cursor-pointer text-[12px] text-mute-2">Stack trace</summary>
          <pre className="mono mt-2 whitespace-pre-wrap text-[10px] text-mute-2">
            {error.stack}
          </pre>
        </details>
      ) : null}
      <button
        onClick={() => reset()}
        className="rounded-sm border border-border-strong px-3 py-1.5 text-[13px] hover:bg-surface"
      >
        Попробовать снова
      </button>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  errorComponent: RouteError,
});
