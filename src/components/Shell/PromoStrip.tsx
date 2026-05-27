import {useState} from "react";
import {Icon} from "@iconify/react";

// Sticky-but-dismissable promo strip with proper cooldown — fixes audit
// anti-pattern P3.  Editorial mono band, no gradient, no glow.

const KEY = "walbi:promo-dismissed-at";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function PromoStrip() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const last = parseInt(window.localStorage.getItem(KEY) ?? "0");
    return Date.now() - last > COOLDOWN_MS;
  });

  function dismiss() {
    window.localStorage.setItem(KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between border-b border-separator bg-ink-12 px-5 py-1.5 font-mono text-[11px] text-mute-2">
      <span className="flex items-center gap-2">
        <span className="text-accent">→</span>
        <span>
          <span className="text-foreground">Авторы стратегий</span> получают 30%
          от комиссий подписчиков. Заявка через профиль.
        </span>
      </span>
      <button
        onClick={dismiss}
        className="rounded-sm p-0.5 text-mute-2 transition-colors hover:text-foreground"
        aria-label="Закрыть"
      >
        <Icon icon="ph:x-bold" className="size-3" />
      </button>
    </div>
  );
}
