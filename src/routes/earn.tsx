import {createFileRoute, Link} from "@tanstack/react-router";
import {Card} from "@heroui/react";
import {Icon} from "@iconify/react";

import {useUI, type SidebarPanel} from "../store/ui";

// Mobile "Экшены" hub. On desktop the same content lives in a right-side
// sidebar; here it's a full page so the bottom-tab paradigm works. Each
// row opens the matching drill-down sidebar.

export const Route = createFileRoute("/earn")({
  component: EarnPage,
});

function EarnPage() {
  const openPanel = useUI((s) => s.openPanel);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Экшены</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <HubCard
          to="/memepool"
          title="Мемепул"
          subtitle="Торгуйте мемами на ходу"
          icon="gravity-ui:flame"
        />
        <HubCard
          to="/predictions"
          title="Прогнозы"
          subtitle="Предскажи, выиграй, получи куш!"
          icon="gravity-ui:graph-up-arrow"
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm uppercase tracking-wider text-muted">
          Зарабатывайте
        </h2>
        <Card className="rounded-lg">
          <Card.Content className="divide-y divide-border p-0">
            <Row title="Реферальная программа" hint="Активные рефералы · 0" onClick={() => openPanel("earn-referral")} />
            <Row title="Майнер" hint="Добытые баллы · 0,0000" onClick={() => openPanel("earn-miner")} />
            <Row title="Ваучеры" hint="Кэшбэк по комиссиям" onClick={() => openPanel("earn-vouchers")} />
            <Row title="Эйрдропы" hint="История розыгрышей" onClick={() => openPanel("earn-airdrops")} />
            <Row title="Задачи" hint="Получай PTS за активность" badge="1" onClick={() => openPanel("earn-tasks")} />
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

function HubCard({
  to,
  title,
  subtitle,
  icon,
}: {
  to: string;
  title: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <Link to={to} className="no-underline" preload="intent">
      <Card className="rounded-lg transition-colors hover:bg-surface-secondary">
        <Card.Content className="flex items-center gap-3 p-4">
          <div className="grid size-10 place-items-center rounded-xl bg-surface-secondary">
            <Icon icon={icon} className="size-5" />
          </div>
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-muted">{subtitle}</div>
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
}

function Row({
  title,
  hint,
  badge,
  onClick,
}: {
  title: string;
  hint: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary"
    >
      <div className="flex-1">
        <div className="text-sm">{title}</div>
        <div className="text-xs text-muted">{hint}</div>
      </div>
      {badge ? (
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
          {badge}
        </span>
      ) : null}
      <Icon icon="gravity-ui:chevron-right" className="size-4 text-muted" />
    </button>
  );
}

// Re-export for type hint in dev — the panel store accepts these strings
void (null as unknown as SidebarPanel);
