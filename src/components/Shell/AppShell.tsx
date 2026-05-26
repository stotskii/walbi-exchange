import type {ReactNode} from "react";
import {Topbar} from "./Topbar";
import {BottomTabs} from "./BottomTabs";

/**
 * Top-level app chrome.
 *   • Desktop ≥ md: Topbar fixed top, content fills below
 *   • Mobile < md: bottom 5-tab bar (matches Walbi's mobile IA — see audit
 *     insight #18), no topbar — header lives in each route
 *
 * Content area gets a key to reset scroll between routes; <Outlet/> already
 * uses scrollRestoration: true from the router config.
 */
export function AppShell({children}: {children: ReactNode}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <Topbar />
      <main className="relative flex-1 overflow-x-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
