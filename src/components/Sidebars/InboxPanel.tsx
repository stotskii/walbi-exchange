import {useMemo, useState} from "react";
import {Icon} from "@iconify/react";

import {INBOX_ALERTS} from "../../lib/mock/data";
import type {InboxAlert} from "../../lib/mock/types";
import {relativeTime} from "../../lib/format";
import {useUI} from "../../store/ui";
import {PanelChrome} from "./PanelChrome";
import {AgentAvatar} from "../AIHub/AgentAvatar";

const CATEGORIES = ["Все", "Торговля", "AI агент", "Поддержка"] as const;

export function InboxPanel() {
  const closePanel = useUI((s) => s.closePanel);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("Все");

  const grouped = useMemo(() => {
    const filtered = INBOX_ALERTS.filter((a) => filter === "Все" || a.category === filter);
    const byDay = new Map<string, InboxAlert[]>();
    for (const a of filtered) {
      const d = new Date(a.timestamp);
      const key = d.toLocaleDateString("ru-RU", {day: "numeric", month: "long"});
      const list = byDay.get(key) ?? [];
      list.push(a);
      byDay.set(key, list);
    }
    return [...byDay.entries()];
  }, [filter]);

  return (
    <PanelChrome title="Входящие">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={[
                "shrink-0 rounded-full px-3 py-1 text-xs transition-colors",
                filter === c ? "bg-surface-secondary" : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              {c}
            </button>
          ))}
        </div>
        <button className="rounded p-1 text-muted hover:bg-surface-secondary" aria-label="Все как прочитанные">
          <Icon icon="gravity-ui:envelope-open" className="size-4" />
        </button>
      </div>

      <div className="p-3">
        {grouped.map(([day, items]) => (
          <div key={day} className="mb-4">
            <div className="mb-2 px-2 text-[10px] uppercase tracking-wider text-muted">
              {day}
            </div>
            <div className="space-y-1">
              {items.map((a) => (
                <button
                  key={a.id}
                  onClick={() => closePanel()}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary"
                >
                  {a.agentName ? (
                    <AgentAvatar name={a.agentName} size={32} />
                  ) : (
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-secondary text-base">
                      {a.emoji}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 truncate text-sm font-medium">
                        {a.agentName ? (
                          <>AI агент · {a.agentName}</>
                        ) : (
                          a.title
                        )}
                      </div>
                      {!a.read ? (
                        <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-accent" />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted">
                      {a.agentName ? a.title : a.body}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                      <span>{a.category}</span>
                      <span>·</span>
                      <span>{relativeTime(a.timestamp)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PanelChrome>
  );
}
