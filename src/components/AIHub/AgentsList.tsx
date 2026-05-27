import {useMemo} from "react";
import {Button, Card} from "@heroui/react";
import {Icon} from "@iconify/react";
import {useQuery} from "@tanstack/react-query";

import {api} from "../../lib/api/rest";
import {useUI} from "../../store/ui";
import {useToasts} from "../../store/toast";
import {AgentAvatar} from "./AgentAvatar";
import {usd, pct} from "../../lib/format";
import type {Agent as WalbiAgent} from "../../lib/api/walbi-types";
import type {Agent as MockAgent} from "../../lib/mock/types";

// Map the live walbi Agent → the shape our UI components expect.
function toUiAgent(a: WalbiAgent): MockAgent {
  return {
    id: a.slug,
    name: a.name,
    description: a.summary,
    riskLevel: a.risk_level === "moderate" ? "medium" : a.risk_level,
    apr30d: (a.statistics.roi_30d ?? a.statistics.apr ?? 0) / 100,
    followers: a.statistics.users,
    balanceUsdt: 0, // не приходит в agent/list — заполнится из agent/session/list позже
    pnlUsdt: 0,
    pnlPct: 0,
    openPositions: 0,
    avatarUrl: a.image,
    badge: undefined,
    pinned: false,
  };
}

export function AgentsList() {
  const setSelectedAgent = useUI((s) => s.setSelectedAgent);
  const selected = useUI((s) => s.selectedAgent);
  const push = useToasts((s) => s.push);

  const q = useQuery({
    queryKey: ["agent", "list"],
    queryFn: () => api.agent.list(0, 50),
    staleTime: 60_000,
  });

  const agents = useMemo<MockAgent[]>(
    () => (q.data?.list ?? []).map(toUiAgent),
    [q.data],
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Мои агенты
        </h2>
        <button
          onClick={() =>
            push({title: "Маркетплейс агентов", description: "Раздел в разработке", tone: "info"})
          }
          className="rounded p-1 text-muted hover:bg-surface-secondary"
          aria-label="Маркетплейс"
          title="Маркетплейс"
        >
          <Icon icon="gravity-ui:layout-cards" className="size-4" />
        </button>
      </div>

      <Card className="rounded-lg">
        <Card.Content className="p-2">
          <Button
            variant="primary"
            fullWidth
            size="sm"
            onPress={() =>
              push({title: "Создать нового агента", description: "3-шаговый мастер в разработке", tone: "info"})
            }
          >
            <Icon icon="gravity-ui:plus" className="mr-1.5" />
            Создать нового агента
          </Button>
        </Card.Content>
      </Card>

      <div className="-mr-1 overflow-y-auto pr-1">
        {q.isLoading ? (
          <div className="space-y-1 px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted">
            Загрузка…
          </div>
        ) : q.isError ? (
          <div className="space-y-1 px-2 py-3 text-xs text-danger">
            Не удалось загрузить агентов
          </div>
        ) : null}

        {agents.length > 0 ? (
          <>
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted">
              {agents.length} агентов
            </div>
            <div className="space-y-1">
              {agents.map((a) => (
                <Row
                  key={a.id}
                  agent={a}
                  active={selected?.id === a.id}
                  onClick={() => setSelectedAgent(a)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  agent,
  active,
  onClick,
}: {
  agent: MockAgent;
  active?: boolean;
  onClick?: () => void;
}) {
  const apr = agent.apr30d;
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors",
        active ? "bg-surface-secondary" : "hover:bg-surface",
      ].join(" ")}
    >
      {agent.avatarUrl ? (
        <img
          src={agent.avatarUrl}
          alt={agent.name}
          className="size-8 shrink-0 rounded-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <AgentAvatar name={agent.name} size={32} badge={agent.badge} />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{agent.name}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span>{usd(agent.balanceUsdt)} USDT</span>
          {apr !== 0 ? (
            <span className={apr > 0 ? "text-success" : "text-danger"}>
              APR {pct(apr)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
