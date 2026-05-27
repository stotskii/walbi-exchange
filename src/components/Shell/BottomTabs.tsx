import {Link, useLocation} from "@tanstack/react-router";
import {Icon} from "@iconify/react";

// Mobile bottom navigation — Phosphor icons (no emoji), no glassmorphism,
// solid surface with hairline top rule.  Active state = accent underline.

const TABS = [
  {to: "/", label: "Хаб", icon: "ph:circles-three-bold"},
  {to: "/signals", label: "Сигналы", icon: "ph:waveform-bold"},
  {to: "/trade", label: "Терминал", icon: "ph:chart-line-bold"},
  {to: "/earn", label: "Экшены", icon: "ph:lightning-bold"},
  {to: "/wallet", label: "Счета", icon: "ph:vault-bold"},
] as const;

export function BottomTabs() {
  const {pathname} = useLocation();

  return (
    <nav
      className="sticky bottom-0 z-40 grid grid-cols-5 border-t border-separator bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Основная навигация"
    >
      {TABS.map((tab) => {
        const active =
          tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            preload="intent"
            className={[
              "relative flex h-14 flex-col items-center justify-center gap-1 text-[10px] no-underline transition-colors",
              active ? "text-foreground" : "text-mute-2",
            ].join(" ")}
          >
            <Icon icon={tab.icon} className="size-[18px]" aria-hidden />
            <span className="font-mono tracking-tight">{tab.label}</span>
            {active ? (
              <span className="absolute inset-x-6 top-0 h-px bg-accent" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
