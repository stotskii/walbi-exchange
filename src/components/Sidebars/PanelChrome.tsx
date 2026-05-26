import type {ReactNode} from "react";
import {Icon} from "@iconify/react";
import {useUI} from "../../store/ui";

export function PanelChrome({
  title,
  showBack,
  children,
}: {
  title: string;
  showBack?: boolean;
  children: ReactNode;
}) {
  const backPanel = useUI((s) => s.backPanel);
  const closePanel = useUI((s) => s.closePanel);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={backPanel}
              className="rounded-lg p-1 text-muted hover:bg-surface-secondary"
              aria-label="Назад"
            >
              <Icon icon="gravity-ui:chevron-left" className="size-5" />
            </button>
          ) : null}
          <h2 className="font-semibold">{title}</h2>
        </div>
        <button
          onClick={closePanel}
          className="rounded-lg p-1 text-muted hover:bg-surface-secondary"
          aria-label="Закрыть"
        >
          <Icon icon="gravity-ui:xmark" className="size-5" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
