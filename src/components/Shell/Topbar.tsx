import {Link, useLocation} from "@tanstack/react-router";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {useUI} from "../../store/ui";

// Desktop topbar (hidden on mobile). Matches Walbi's 7-button paradigm:
// AI хаб / Сигналы / Торговля / Мемепул / Прогнозы / Депозит / Кошелек
// Plus topbar icons: Earn / Inbox / AppStores / Profile.

const NAV = [
  {to: "/", label: "AI хаб"},
  {to: "/signals", label: "Сигналы"},
  {to: "/trade", label: "Торговля"},
  {to: "/memepool", label: "Мемепул"},
  {to: "/predictions", label: "Прогнозы"},
  {to: "/wallet", label: "Кошелек"},
] as const;

export function Topbar() {
  const {pathname} = useLocation();
  const openPanel = useUI((s) => s.openPanel);

  return (
    <header className="sticky top-0 z-30 hidden h-14 shrink-0 border-b border-border bg-background/85 backdrop-blur md:flex">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-1 px-4">
        <Link
          to="/"
          className="mr-3 flex items-center gap-2 text-sm font-semibold tracking-tight no-underline"
          aria-label="Walbi Exchange home"
        >
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-accent to-purple-600 text-xs font-bold text-white">
            W
          </span>
          <span>Walbi</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className={[
                  "rounded-xl px-3 py-1.5 text-sm transition-colors no-underline",
                  active
                    ? "bg-surface-secondary text-foreground"
                    : "text-muted hover:bg-surface hover:text-foreground",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button variant="primary" size="sm" className="ml-3">
          <Icon icon="gravity-ui:arrow-down-to-line" className="mr-1.5" />
          Депозит
        </Button>

        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn icon="gravity-ui:bolt" label="Экшены" onClick={() => openPanel("earn")} />
          <IconBtn icon="gravity-ui:bell" label="Уведомления" onClick={() => openPanel("inbox")} badge={3} />
          <IconBtn icon="gravity-ui:devices" label="Мобильное приложение" onClick={() => openPanel("app-stores")} />
          <IconBtn icon="gravity-ui:person" label="Профиль" onClick={() => openPanel("profile")} />
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  icon,
  label,
  onClick,
  badge,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
    >
      <Icon icon={icon} className="size-4" />
      {badge ? (
        <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}
