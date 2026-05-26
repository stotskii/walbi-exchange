import {Card, Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {useUI} from "../../store/ui";
import {AGENTS} from "../../lib/mock/data";
import {AgentAvatar} from "./AgentAvatar";
import {usd, pct, num} from "../../lib/format";

// Right rail: details of the selected agent (or overview if none selected).
// Includes the "Traffic Light" daily P/L card pattern from the audit.

export function AgentDetail() {
  const agent = useUI((s) => s.selectedAgent);

  if (!agent) {
    return <Overview />;
  }

  const riskColor =
    agent.riskLevel === "low"
      ? "text-success"
      : agent.riskLevel === "medium"
        ? "text-warning"
        : "text-danger";

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      <Card className="rounded-2xl">
        <Card.Content className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <AgentAvatar name={agent.name} size={48} badge={agent.badge} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{agent.name}</div>
              <div className={["text-xs", riskColor].join(" ")}>
                {agent.riskLevel === "low" ? "Низкий риск" : agent.riskLevel === "medium" ? "Средний риск" : "Высокий риск"}
              </div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted">{agent.description}</p>
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Content className="grid grid-cols-2 gap-3 p-4 text-xs">
          <Metric label="Баланс" value={`${usd(agent.balanceUsdt)} USDT`} />
          <Metric label="APR 30д" value={pct(agent.apr30d)} tone={agent.apr30d >= 0 ? "success" : "danger"} />
          <Metric label="PnL" value={agent.pnlUsdt.toFixed(2)} tone={agent.pnlUsdt >= 0 ? "success" : "danger"} suffix={`(${pct(agent.pnlPct)})`} />
          <Metric label="Открыто позиций" value={String(agent.openPositions)} />
          <Metric label="Подписчиков" value={num(agent.followers)} />
          <Metric label="Статус" value={agent.openPositions > 0 ? "Торгует" : "Ждёт"} tone={agent.openPositions > 0 ? "success" : undefined} />
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Content className="space-y-2 p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Параметры</div>
          <Param label="Тикеры" value="BTC, ETH, SOL" />
          <Param label="Индикатор" value="MACD" />
          <Param label="Тайм-фрейм" value="15m / 1h" />
          <Param label="Open condition" value="MACD crossover + volume spike" />
          <Param label="Close condition" value="MACD reverse OR TP/SL hit" />
          <Param label="Макс. размер позиции" value="2% от баланса" />
          <Param label="Auto-pause при просадке" value="−10% от пиковой стоимости" />
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Content className="space-y-2 p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Дневной P/L</div>
          <div className="flex h-8 items-end gap-0.5">
            {Array.from({length: 30}).map((_, i) => {
              const v = Math.sin(i / 3) * 0.5 + (Math.random() - 0.3);
              const positive = v >= 0;
              return (
                <span
                  key={i}
                  className={[
                    "flex-1 rounded-sm",
                    positive ? "bg-success/70" : "bg-danger/70",
                  ].join(" ")}
                  style={{height: `${Math.abs(v) * 100 + 5}%`}}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>30 дней</span>
            <span className="text-success">+12,40 USDT сегодня</span>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" size="sm">
          <Icon icon="gravity-ui:play" className="mr-1" />
          Запустить
        </Button>
        <Button variant="danger-soft" size="sm">
          <Icon icon="gravity-ui:pause" className="mr-1" />
          Пауза
        </Button>
      </div>
    </div>
  );
}

function Overview() {
  // Aggregate stats when no agent is picked
  const totalBalance = AGENTS.reduce((s, a) => s + a.balanceUsdt, 0);
  const totalPnl = AGENTS.reduce((s, a) => s + a.pnlUsdt, 0);
  const profitable = AGENTS.filter((a) => a.pnlUsdt >= 0).length;
  const loss = AGENTS.length - profitable;

  return (
    <div className="flex h-full flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">
        Контекст
      </h2>
      <Card className="rounded-2xl">
        <Card.Content className="space-y-3 p-4 text-sm">
          <Metric label="Баланс ИИ-агентов" value={`${usd(totalBalance)} USDT`} />
          <Metric
            label="Сегодняшний PnL"
            value={(totalPnl >= 0 ? "+" : "") + totalPnl.toFixed(2)}
            tone={totalPnl >= 0 ? "success" : "danger"}
          />
          <Metric label="В плюсе" value={`${profitable} / ${AGENTS.length}`} />
          <Metric label="В минусе" value={String(loss)} />
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Content className="space-y-2 p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Лидеры дня</div>
          {AGENTS
            .filter((a) => a.pnlUsdt > 0)
            .sort((a, b) => b.pnlUsdt - a.pnlUsdt)
            .slice(0, 3)
            .map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <AgentAvatar name={a.name} size={20} />
                  <span className="truncate">{a.name}</span>
                </span>
                <span className="text-success">+{a.pnlUsdt.toFixed(2)}</span>
              </div>
            ))}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl border-accent/30 bg-accent/5">
        <Card.Content className="p-4 text-sm">
          <div className="mb-1 font-medium">Мы нанимаем авторов стратегий</div>
          <p className="text-xs text-muted">
            Создай прибыльного агента и получай 30% от комиссий подписчиков.
          </p>
          <Button variant="primary" size="sm" className="mt-2" fullWidth>
            Стать автором
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}

function Metric({label, value, tone, suffix}: {label: string; value: string; tone?: "success" | "danger"; suffix?: string}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <span className={["font-medium tabular-nums", tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""].join(" ")}>
        {value} {suffix ? <span className="text-muted">{suffix}</span> : null}
      </span>
    </div>
  );
}

function Param({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

// Add an alias to keep the metric component used in nested places consistent
function pnlOf(_a: unknown) {return _a}
void pnlOf;
