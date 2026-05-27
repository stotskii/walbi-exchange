import {Link, useLocation, useNavigate} from "@tanstack/react-router";
import {Icon} from "@iconify/react";

import {useUI} from "../../store/ui";
import {useToasts} from "../../store/toast";

// Topbar — editorial dense, not SaaS-template.  No gradients, no rounded-lg,
// monospace wordmark, typographic active state (low-key bottom rule, not pill).

const NAV = [
  {to: "/", label: "Хаб"},
  {to: "/signals", label: "Сигналы"},
  {to: "/trade", label: "Терминал"},
  {to: "/memepool", label: "Мемепул"},
  {to: "/predictions", label: "Прогнозы"},
  {to: "/wallet", label: "Счета"},
] as const;

export function Topbar() {
  const {pathname} = useLocation();
  const openPanel = useUI((s) => s.openPanel);
  const navigate = useNavigate();
  const push = useToasts((s) => s.push);

  function depositCta() {
    if (pathname === "/wallet") {
      push({title: "Жми «Депозит» в карточке счёта ↓", tone: "info", ttl: 3000});
      return;
    }
    void navigate({to: "/wallet"}).then(() => {
      push({title: "Открой «Депозит» в карточке счёта", tone: "info", ttl: 3000});
    });
  }

  return (
    <header className="sticky top-0 z-30 hidden h-12 shrink-0 border-b border-separator bg-background md:flex">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-6 px-5">
        {/* Wordmark — monospace, no gradient, no logo-tile */}
        <Link
          to="/"
          className="flex items-baseline gap-1.5 font-mono text-[13px] tracking-tight no-underline"
          aria-label="Walbi Exchange home"
        >
          <span className="text-foreground">walbi</span>
          <span className="text-accent">/</span>
          <span className="text-mute-2">exchange</span>
        </Link>

        <nav className="flex items-center gap-5">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className={[
                  "relative py-1 text-[13px] no-underline transition-colors",
                  active ? "text-foreground" : "text-mute-2 hover:text-foreground",
                ].join(" ")}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-[13px] h-px bg-accent" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={depositCta}
          className="ml-3 flex items-center gap-1.5 rounded-sm bg-foreground px-2.5 py-1 text-[12px] font-medium text-ink-12 transition-opacity hover:opacity-90"
        >
          <Icon icon="ph:arrow-down-bold" className="size-3" />
          Депозит
        </button>

        <div className="ml-auto flex items-center gap-1 font-mono text-[11px] text-mute-2">
          <span className="live-dot" aria-hidden />
          <span>live</span>
        </div>

        <div className="flex items-center gap-0.5">
          <IconBtn icon="ph:lightning-bold" label="Экшены" onClick={() => openPanel("earn")} />
          <IconBtn icon="ph:bell-bold" label="Уведомления" onClick={() => openPanel("inbox")} badge={3} />
          <IconBtn icon="ph:device-mobile-bold" label="Мобильное" onClick={() => openPanel("app-stores")} />
          <IconBtn icon="ph:user-bold" label="Профиль" onClick={() => openPanel("profile")} />
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
      className="relative grid size-8 place-items-center rounded-sm text-mute-2 transition-colors hover:bg-surface hover:text-foreground"
    >
      <Icon icon={icon} className="size-[15px]" />
      {badge ? (
        <span className="absolute right-0.5 top-0.5 grid min-w-[14px] place-items-center rounded-full bg-accent px-1 text-[9px] font-medium leading-[14px] text-accent-foreground">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}
