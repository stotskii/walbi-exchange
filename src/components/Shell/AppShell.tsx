import type {ReactNode} from "react";
import {Topbar} from "./Topbar";
import {BottomTabs} from "./BottomTabs";
import {PromoStrip} from "./PromoStrip";
import {SidebarHost} from "../Sidebars/SidebarHost";
import {ToastHost} from "./ToastHost";

/**
 * Top-level app chrome.
 *   • Desktop ≥ md: Topbar fixed top, content fills below
 *   • Mobile < md: bottom 5-tab bar (matches Walbi's mobile IA — see audit
 *     insight #18), no topbar — header lives in each route
 *
 * SidebarHost handles all right-side drill-down panels (Earn / Inbox / etc.)
 * driven by the Zustand UI store.
 */
export function AppShell({children}: {children: ReactNode}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <PromoStrip />
      <Topbar />
      <main className="relative flex-1 overflow-x-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
        <div className="walbi-fade-in">{children}</div>
      </main>
      <BottomTabs />
      <SidebarHost />
      <ToastHost />
    </div>
  );
}
