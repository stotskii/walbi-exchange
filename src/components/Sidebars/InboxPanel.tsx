import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "@tanstack/react-router";
import {Icon} from "@iconify/react";

import {INBOX_ALERTS} from "../../lib/mock/data";
import type {InboxAlert} from "../../lib/mock/types";
import {relativeTime} from "../../lib/format";
import {useUI} from "../../store/ui";
import {useToasts} from "../../store/toast";
import {PanelChrome} from "./PanelChrome";
import {AgentAvatar} from "../AIHub/AgentAvatar";
import {walbiSocket, subscribeNotifications} from "../../lib/api/ws";
import {WS_EVENT} from "../../lib/api/walbi-types";

const CATEGORIES = ["Все", "Торговля", "AI агент", "Поддержка"] as const;

// Best-effort shape — Walbi notification payload is rich and varies per
// kind (price anomaly, agent message, deal close, voucher, etc.). We only
// pluck what the UI needs.
interface WalbiNotification {
  id?: number | string;
  uid?: string;
  type?: string;
  kind?: string;
  category?: string;
  title?: string;
  message?: string;
  text?: string;
  body?: string;
  pair?: string;
  agent_name?: string;
  agent?: {name?: string};
  ts?: number;
  created_at?: number;
  read?: boolean;
  emoji?: string;
  deeplink?: string;
}

function toInboxAlert(n: WalbiNotification, idx: number): InboxAlert {
  const ts = ((n.ts ?? n.created_at ?? Date.now() / 1000) || 0) * 1000;
  const cat =
    (n.category as InboxAlert["category"]) ??
    (n.agent_name || n.agent?.name ? "AI агент" : "Торговля");
  const agentName = n.agent_name ?? n.agent?.name;
  return {
    id: String(n.id ?? n.uid ?? `live-${idx}-${ts}`),
    type: ((n.type as InboxAlert["type"]) ?? "price-anomaly"),
    emoji: n.emoji ?? "🔔",
    title: n.title ?? n.message ?? n.text ?? "Новое уведомление",
    body: n.body ?? n.text ?? n.message ?? "",
    category: cat,
    agentName,
    pair: n.pair,
    timestamp: ts,
    read: !!n.read,
    deeplinkTo:
      n.deeplink ??
      (n.pair ? `/trade?pair=${n.pair}` : agentName ? "/" : undefined),
  };
}

export function InboxPanel() {
  const closePanel = useUI((s) => s.closePanel);
  const setCurrentPair = useUI((s) => s.setCurrentPair);
  const navigate = useNavigate();
  const push = useToasts((s) => s.push);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("Все");
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(INBOX_ALERTS.filter((a) => a.read).map((a) => a.id)),
  );
  const [liveAlerts, setLiveAlerts] = useState<InboxAlert[]>([]);

  useEffect(() => {
    const off = subscribeNotifications((data, eventName) => {
      if (!data) return;
      const arr = Array.isArray(data) ? (data as WalbiNotification[]) : [data as WalbiNotification];
      if (eventName === WS_EVENT.NOTIFICATION_DELETE.name) {
        // simple: remove matching ids
        const ids = new Set(arr.map((n) => String(n.id ?? n.uid)));
        setLiveAlerts((prev) => prev.filter((a) => !ids.has(a.id)));
        return;
      }
      setLiveAlerts((prev) => {
        const next = [...prev];
        arr.forEach((n, i) => {
          const card = toInboxAlert(n, next.length + i);
          if (!next.find((a) => a.id === card.id)) next.unshift(card);
        });
        return next.slice(0, 100);
      });
    });
    return off;
  }, []);

  const alerts = liveAlerts.length > 0 ? liveAlerts : INBOX_ALERTS;

  const grouped = useMemo(() => {
    const filtered = alerts.filter((a) => filter === "Все" || a.category === filter);
    const byDay = new Map<string, InboxAlert[]>();
    for (const a of filtered) {
      const d = new Date(a.timestamp);
      const key = d.toLocaleDateString("ru-RU", {day: "numeric", month: "long"});
      const list = byDay.get(key) ?? [];
      list.push(a);
      byDay.set(key, list);
    }
    return [...byDay.entries()];
  }, [filter, alerts]);

  async function openAlert(a: InboxAlert) {
    setReadIds((prev) => new Set(prev).add(a.id));
    // mark read on server (best effort)
    void walbiSocket
      .request(WS_EVENT.NOTIFICATION_READ.name, {id: a.id})
      .catch(() => {
        // ignore
      });

    if (a.deeplinkTo) {
      const [path, query] = a.deeplinkTo.split("?");
      if (query) {
        const params = new URLSearchParams(query);
        const pair = params.get("pair");
        if (pair) setCurrentPair(pair);
      }
      navigate({to: path}).catch(() => {
        // ignore
      });
      closePanel();
    } else {
      push({title: a.title, description: a.body, tone: "info"});
    }
  }

  function markAllRead() {
    setReadIds(new Set(alerts.map((a) => a.id)));
    push({title: "Все отмечены прочитанными", tone: "info", ttl: 2000});
  }

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
        <button
          onClick={markAllRead}
          className="rounded p-1 text-muted hover:bg-surface-secondary"
          aria-label="Все как прочитанные"
          title="Все как прочитанные"
        >
          <Icon icon="gravity-ui:envelope-open" className="size-4" />
        </button>
      </div>

      <div className="p-3">
        {liveAlerts.length === 0 ? (
          <div className="mb-2 rounded-lg border border-border bg-surface px-3 py-2 text-[10px] text-muted">
            Показаны примеры — живые уведомления подключатся когда WALBI пушнёт первое
          </div>
        ) : null}
        {grouped.map(([day, items]) => (
          <div key={day} className="mb-4">
            <div className="mb-2 px-2 text-[10px] uppercase tracking-wider text-muted">
              {day}
            </div>
            <div className="space-y-1">
              {items.map((a) => {
                const isRead = readIds.has(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => void openAlert(a)}
                    className="flex w-full items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary"
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
                          {a.agentName ? <>AI агент · {a.agentName}</> : a.title}
                        </div>
                        {!isRead ? (
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
                        {a.deeplinkTo ? (
                          <>
                            <span>·</span>
                            <span className="text-accent">открыть →</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PanelChrome>
  );
}
