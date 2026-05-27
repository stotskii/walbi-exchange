import {AnimatePresence, motion} from "framer-motion";
import {Icon} from "@iconify/react";
import {useToasts, type Toast} from "../../store/toast";

// Stacked toasts in top-right corner (top-center on mobile to avoid clashing
// with the bottom tab bar).

const ICONS: Record<Toast["tone"], string> = {
  success: "gravity-ui:circle-check",
  danger: "gravity-ui:circle-xmark",
  info: "gravity-ui:circle-info",
};

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3 md:left-auto md:right-4 md:top-16 md:items-end md:px-0"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{opacity: 0, y: -10, scale: 0.97}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, scale: 0.97, transition: {duration: 0.12}}}
            transition={{type: "spring", damping: 24, stiffness: 320}}
            className={[
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface px-3 py-2.5 shadow-overlay",
              t.tone === "success"
                ? "border-success/30"
                : t.tone === "danger"
                  ? "border-danger/30"
                  : "border-border",
            ].join(" ")}
          >
            <Icon
              icon={ICONS[t.tone]}
              className={[
                "mt-0.5 size-5 shrink-0",
                t.tone === "success"
                  ? "text-success"
                  : t.tone === "danger"
                    ? "text-danger"
                    : "text-accent",
              ].join(" ")}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              {t.description ? (
                <div className="mt-0.5 text-xs text-muted">{t.description}</div>
              ) : null}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="-mr-1 -mt-1 rounded p-1 text-muted hover:bg-surface-secondary hover:text-foreground"
              aria-label="Закрыть"
            >
              <Icon icon="gravity-ui:xmark" className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
