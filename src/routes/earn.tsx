import {createFileRoute, Link} from "@tanstack/react-router";
import {Card} from "@heroui/react";
import {Icon} from "@iconify/react";

export const Route = createFileRoute("/earn")({
  component: EarnPage,
});

// Mobile "Экшены" hub. On desktop the same content lives in a right-side
// sidebar; here it's a full page so the bottom-tab paradigm works.

function EarnPage() {
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
        <Card className="rounded-2xl">
          <Card.Content className="divide-y divide-border p-0">
            <Row title="Реферальная программа" hint="Активные рефералы · 0" />
            <Row title="Майнер" hint="Добытые баллы · 0,0000" />
            <Row title="Ваучеры" hint="Кэшбэк по комиссиям" />
            <Row title="Эйрдропы" hint="История розыгрышей" />
            <Row title="Задачи" hint="Получай PTS за активность" badge="1" />
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
      <Card className="rounded-2xl transition-colors hover:bg-surface-secondary">
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
}: {
  title: string;
  hint: string;
  badge?: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary">
      <div className="flex-1">
        <div className="text-sm">{title}</div>
        <div className="text-xs text-muted">{hint}</div>
      </div>
      {badge ? (
        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
          {badge}
        </span>
      ) : null}
      <Icon icon="gravity-ui:chevron-right" className="size-4 text-muted" />
    </button>
  );
}
