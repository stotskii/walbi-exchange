import {useState} from "react";
import {Icon} from "@iconify/react";

// Sticky-but-dismissable promo strip — mirrors Walbi's "We are hiring"
// pattern but with a proper cooldown stored in localStorage so it doesn't
// re-appear immediately after being dismissed (audit anti-pattern P3 fix).

const KEY = "walbi:promo-dismissed-at";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 1 day

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
    <div className="flex items-center justify-between border-b border-accent/30 bg-gradient-to-r from-accent/15 to-purple-700/15 px-4 py-1.5 text-xs">
      <span className="flex items-center gap-1.5">
        <Icon icon="gravity-ui:sparkles" className="size-3.5 text-accent" />
        Мы нанимаем авторов стратегий — поделись на 30% от комиссий подписчиков 🚀
      </span>
      <button
        onClick={dismiss}
        className="rounded p-0.5 text-muted hover:text-foreground"
        aria-label="Закрыть"
      >
        <Icon icon="gravity-ui:xmark" className="size-3.5" />
      </button>
    </div>
  );
}
