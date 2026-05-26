import {Link, useLocation} from "@tanstack/react-router";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";

// Desktop topbar (hidden on mobile). Matches Walbi's 7-button paradigm:
// AI хаб / Сигналы / Торговля / Мемепул / Прогнозы / Депозит / Кошелек
// Plus topbar icons: Earn / Inbox / AppStores / Profile.

const NAV = [
  {to: "/", label: "AI хаб", icon: "gravity-ui:sparkles"},
  {to: "/signals", label: "Сигналы", icon: "gravity-ui:layout-cards"},
  {to: "/trade", label: "Торговля", icon: "gravity-ui:bars-ascending-align-center"},
  {to: "/memepool", label: "Мемепул", icon: "gravity-ui:flame"},
  {to: "/predictions", label: "Прогнозы", icon: "gravity-ui:graph-up-arrow"},
  {to: "/wallet", label: "Кошелек", icon: "gravity-ui:wallet"},
] as const;

export function Topbar() {
  const {pathname} = useLocation();

  return (
    <header className="sticky top-0 z-40 hidden h-14 shrink-0 border-b border-border bg-background/85 backdrop-blur md:flex">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-1 px-4">
        <Link
          to="/"
          className="mr-3 flex items-center gap-2 text-sm font-semibold tracking-tight no-underline"
          aria-label="Walbi Exchange home"
        >
          <span className="inline-block size-6 rounded-md bg-accent" />
          <span>Walbi</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
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

        <div className="ml-auto flex items-center gap-1">
          <Button isIconOnly variant="ghost" size="sm" aria-label="Экшены">
            <Icon icon="gravity-ui:bolt" />
          </Button>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Уведомления">
            <Icon icon="gravity-ui:bell" />
          </Button>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Мобильное приложение">
            <Icon icon="gravity-ui:devices" />
          </Button>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Профиль">
            <Icon icon="gravity-ui:person" />
          </Button>
        </div>
      </div>
    </header>
  );
}
