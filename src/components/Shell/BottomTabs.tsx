import {Link, useLocation} from "@tanstack/react-router";
import {Icon} from "@iconify/react";

// Mobile bottom navigation. 5-tab paradigm from Walbi audit:
//   AI хаб / Сигналы / Торговля / Экшены (Memepool + Predictions + Earn hub) / Кошелек
// "Экшены" is intentionally a hub, not a route — clicking it leads to /earn
// which renders the combined hub view. See audit insight #18.

const TABS = [
  {to: "/", label: "AI хаб", icon: "gravity-ui:sparkles"},
  {to: "/signals", label: "Сигналы", icon: "gravity-ui:layout-cards"},
  {to: "/trade", label: "Торговля", icon: "gravity-ui:bars-ascending-align-center"},
  {to: "/earn", label: "Экшены", icon: "gravity-ui:bolt"},
  {to: "/wallet", label: "Кошелек", icon: "gravity-ui:wallet"},
] as const;

export function BottomTabs() {
  const {pathname} = useLocation();

  return (
    <nav
      className="sticky bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Основная навигация"
    >
      {TABS.map((tab) => {
        const active =
          tab.to === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            preload="intent"
            className={[
              "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors no-underline",
              active ? "text-foreground" : "text-muted",
            ].join(" ")}
          >
            <Icon icon={tab.icon} className="size-5" aria-hidden />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
