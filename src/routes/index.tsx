import {createFileRoute} from "@tanstack/react-router";
import {Card, Button} from "@heroui/react";
import {Icon} from "@iconify/react";

// AI Hub — the central command center. Mirrors Walbi's 3-column layout
// (sidebar | chat | right panel) on desktop, collapses to a single column
// on mobile.

export const Route = createFileRoute("/")({
  component: AIHubPage,
});

function AIHubPage() {
  return (
    <div className="mx-auto grid w-full max-w-screen-2xl gap-4 p-4 md:grid-cols-[260px_1fr_320px]">
      {/* Left: agents / chats list */}
      <aside className="hidden flex-col gap-2 md:flex">
        <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Мои агенты
        </h2>
        <Card className="rounded-2xl">
          <Card.Content className="p-3">
            <Button variant="primary" fullWidth>
              <Icon icon="gravity-ui:plus" className="mr-1.5" />
              Создать нового агента
            </Button>
          </Card.Content>
        </Card>
        <AgentRow name="Мета чат" subtitle="Универсальный командный интерфейс" />
        <AgentRow name="Traffic Light" subtitle="+38,67 USDT" trend="up" />
        <AgentRow name="Traffic Light Custom" subtitle="−51,43 USDT" trend="down" />
      </aside>

      {/* Center: chat */}
      <section className="flex min-h-[calc(100svh-200px)] flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">AI хаб</h1>
        <Card className="flex flex-1 flex-col rounded-2xl">
          <Card.Content className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex-1 rounded-xl bg-surface-secondary p-3 text-sm text-muted">
              Привет! Я Мета чат. Помогу запустить стратегию, открыть позицию или
              разобраться в рынке. Спроси что-нибудь — например, «покажи мой PnL
              за неделю» или «открой лонг BTC на ×3».
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <input
                placeholder="Сообщение или команда…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <Button isIconOnly variant="primary" size="sm" aria-label="Отправить">
                <Icon icon="gravity-ui:arrow-up" />
              </Button>
            </div>
          </Card.Content>
        </Card>
      </section>

      {/* Right: agent details / context */}
      <aside className="hidden flex-col gap-2 md:flex">
        <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Контекст
        </h2>
        <Card className="rounded-2xl">
          <Card.Content className="space-y-3 p-3 text-sm">
            <Stat label="Баланс ИИ-агентов" value="$31 287,61" />
            <Stat label="Дневной PnL" value="+12,40 USDT" valueClass="text-success" />
            <Stat label="Открытых позиций" value="3" />
          </Card.Content>
        </Card>
      </aside>
    </div>
  );
}

function AgentRow({
  name,
  subtitle,
  trend,
}: {
  name: string;
  subtitle: string;
  trend?: "up" | "down";
}) {
  return (
    <Card className="rounded-2xl">
      <Card.Content className="flex items-center gap-3 p-3">
        <div className="size-9 shrink-0 rounded-full bg-surface-secondary" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{name}</div>
          <div
            className={[
              "truncate text-xs",
              trend === "up"
                ? "text-success"
                : trend === "down"
                  ? "text-danger"
                  : "text-muted",
            ].join(" ")}
          >
            {subtitle}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={["font-medium", valueClass].filter(Boolean).join(" ")}>
        {value}
      </span>
    </div>
  );
}
