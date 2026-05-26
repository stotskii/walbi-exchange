import {Button, Card} from "@heroui/react";
import {Icon} from "@iconify/react";

import {AGENTS} from "../../lib/mock/data";
import {useUI} from "../../store/ui";
import {useToasts} from "../../store/toast";
import {AgentAvatar} from "./AgentAvatar";
import {usd, pct} from "../../lib/format";

export function AgentsList() {
  const setSelectedAgent = useUI((s) => s.setSelectedAgent);
  const selected = useUI((s) => s.selectedAgent);
  const push = useToasts((s) => s.push);
  const pinned = AGENTS.filter((a) => a.pinned);
  const others = AGENTS.filter((a) => !a.pinned);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Мои агенты
        </h2>
        <button
          onClick={() => push({title: "Маркетплейс агентов", description: "Раздел в разработке", tone: "info"})}
          className="rounded p-1 text-muted hover:bg-surface-secondary"
          aria-label="Маркетплейс"
          title="Маркетплейс"
        >
          <Icon icon="gravity-ui:layout-cards" className="size-4" />
        </button>
      </div>

      <Card className="rounded-2xl">
        <Card.Content className="p-2">
          <Button
            variant="primary"
            fullWidth
            size="sm"
            onPress={() => push({title: "Создать нового агента", description: "3-шаговый мастер в разработке", tone: "info"})}
          >
            <Icon icon="gravity-ui:plus" className="mr-1.5" />
            Создать нового агента
          </Button>
        </Card.Content>
      </Card>

      <div className="-mr-1 overflow-y-auto pr-1">
        {pinned.length > 0 ? (
          <div className="mb-1">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted">
              Закреплено
            </div>
            <div className="space-y-1">
              {pinned.map((a) => (
                <Row
                  key={a.id}
                  name={a.name}
                  balance={a.balanceUsdt}
                  pnl={a.pnlUsdt}
                  pnlPct={a.pnlPct}
                  badge={a.badge}
                  active={selected?.id === a.id}
                  onClick={() => setSelectedAgent(a)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted">
          Активные
        </div>
        <div className="space-y-1">
          {others.map((a) => (
            <Row
              key={a.id}
              name={a.name}
              balance={a.balanceUsdt}
              pnl={a.pnlUsdt}
              pnlPct={a.pnlPct}
              badge={a.badge}
              active={selected?.id === a.id}
              onClick={() => setSelectedAgent(a)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  name,
  balance,
  pnl,
  pnlPct,
  badge,
  active,
  onClick,
}: {
  name: string;
  balance: number;
  pnl: number;
  pnlPct: number;
  badge?: "trending" | "verified" | "hiring";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors",
        active ? "bg-surface-secondary" : "hover:bg-surface",
      ].join(" ")}
    >
      <AgentAvatar name={name} size={32} badge={badge} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{name}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span>{usd(balance)} USDT</span>
          {pnl !== 0 ? (
            <span className={pnl > 0 ? "text-success" : "text-danger"}>
              {pct(pnlPct)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
