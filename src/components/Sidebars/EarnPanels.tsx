import {useState} from "react";
import {Button, Card} from "@heroui/react";
import {Icon} from "@iconify/react";

import {AIRDROPS, EARN_TASKS} from "../../lib/mock/data";
import {usd} from "../../lib/format";
import {useUI} from "../../store/ui";
import {useToasts} from "../../store/toast";
import {PanelChrome} from "./PanelChrome";

export function EarnHub() {
  const drill = useUI((s) => s.drillPanel);
  const setAirdrop = useUI((s) => s.setSelectedAirdropId);
  const push = useToasts((s) => s.push);
  return (
    <PanelChrome title="Экшены">
      <div className="space-y-5 p-4">
        <section>
          <div className="mb-3 text-xs uppercase tracking-wider text-muted">
            Зарабатывайте
          </div>
          <Card className="rounded-2xl">
            <Card.Content className="divide-y divide-border p-0">
              <HubRow icon="gravity-ui:gift" title="Реферальная программа" hint="Активные рефералы · 0" onClick={() => drill("earn-referral")} />
              <HubRow icon="gravity-ui:hammer" title="Майнер" hint="Добытые баллы · 0,0000" onClick={() => drill("earn-miner")} />
              <HubRow icon="gravity-ui:ticket" title="Ваучеры" hint="Кэшбэк по комиссиям" onClick={() => drill("earn-vouchers")} />
              <HubRow icon="gravity-ui:cloud-arrow-up-in" title="Эйрдропы" hint="История розыгрышей" onClick={() => {
                setAirdrop(null);
                drill("earn-airdrops");
              }} />
              <HubRow icon="gravity-ui:list-check" title="Задачи" hint="Получай PTS за активность" badge="1" onClick={() => drill("earn-tasks")} />
            </Card.Content>
          </Card>
        </section>

        <section>
          <div className="mb-2 text-xs uppercase tracking-wider text-muted">
            Активные задачи
          </div>
          <Card className="rounded-2xl">
            <Card.Content className="space-y-3 p-4">
              <div className="text-sm font-medium">Первый депозит</div>
              <p className="text-xs text-muted">
                Будущий ты скажет тебе спасибо за это. Сделай свой первый депозит.
              </p>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onPress={() => push({title: "Сделай первый депозит", description: "Открой Кошелёк → Депозит", tone: "info"})}
              >
                Получить награду
              </Button>
            </Card.Content>
          </Card>
        </section>
      </div>
    </PanelChrome>
  );
}

export function EarnReferral() {
  const push = useToasts((s) => s.push);
  const code = "8a131f";
  const link = "https://walbi.com/r/" + code;

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => push({title: `${label} скопирован`, tone: "success", ttl: 2000}),
      () => push({title: "Не удалось скопировать", tone: "danger"}),
    );
  }

  function share() {
    if ("share" in navigator) {
      navigator.share({title: "Walbi", text: "Присоединяйся к Walbi", url: link}).catch(() => {});
    } else {
      copy(link, "Ссылка");
    }
  }

  return (
    <PanelChrome title="Реферальная программа" showBack>
      <div className="space-y-4 p-4">
        <Card className="rounded-2xl">
          <Card.Content className="space-y-4 p-4 text-sm">
            <div>
              <div className="text-xs text-muted">Твой ID</div>
              <div className="text-lg font-semibold">#2194502</div>
            </div>

            <div>
              <div className="mb-1 text-xs text-muted">Реферальный код</div>
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
                <span className="flex-1 font-mono text-base">{code}</span>
                <Button variant="ghost" size="sm" onPress={() => copy(code, "Код")}>
                  <Icon icon="gravity-ui:copy" className="mr-1" />
                  Копировать
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-muted">Реферальная ссылка</div>
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs text-muted">
                  walbi.com/r/{code}
                </span>
                <Button variant="ghost" size="sm" onPress={share}>
                  Поделиться
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Content className="space-y-3 p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Статистика</div>
            <Row k="Активных рефералов" v="0" />
            <Row k="Общий доход" v="0,0000 USDT" />
          </Card.Content>
        </Card>

        <Card className="rounded-2xl border-accent/30 bg-accent/5">
          <Card.Content className="space-y-2 p-4 text-sm">
            <div className="font-medium">Двухуровневая комиссия</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">От прямых рефералов</span>
              <span className="text-success">10%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">От их рефералов</span>
              <span className="text-success">5%</span>
            </div>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Content className="space-y-3 p-4">
            <div className="text-sm font-medium">Доступно к выводу</div>
            <div className="text-2xl font-semibold tabular-nums">0,0000 USDT</div>
            <p className="text-[10px] text-muted">
              Минимум 10 USDT. Зачисляется на Фандинговый счёт в течение 24 часов.
            </p>
            <Button variant="primary" fullWidth isDisabled>
              Забрать
            </Button>
          </Card.Content>
        </Card>
      </div>
    </PanelChrome>
  );
}

export function EarnMiner() {
  const push = useToasts((s) => s.push);
  const [mining, setMining] = useState(false);

  return (
    <PanelChrome title="Майнер" showBack>
      <div className="grid place-items-center p-10 text-center">
        <Icon
          icon="gravity-ui:hammer"
          className={["size-12", mining ? "animate-pulse text-accent" : "text-muted"].join(" ")}
        />
        <div className="mt-3 text-3xl font-bold tabular-nums">0</div>
        <div className="text-xs text-muted">{mining ? "добывается…" : "добытых баллов"}</div>
        <Button
          variant={mining ? "danger-soft" : "primary"}
          className="mt-6"
          onPress={() => {
            setMining((v) => !v);
            push({
              title: mining ? "Майнинг остановлен" : "Майнинг запущен",
              description: mining ? undefined : "PTS будут начисляться каждый час активной торговли",
              tone: mining ? "info" : "success",
            });
          }}
        >
          {mining ? "Остановить" : "Начать майнинг"}
        </Button>
        <p className="mt-3 max-w-xs text-[10px] text-muted">
          Майнер начисляет PTS пассивно за каждый час активной торговли.
          Чем больше объём сделок, тем выше скорость накопления.
        </p>
      </div>
    </PanelChrome>
  );
}

export function EarnVouchers() {
  const push = useToasts((s) => s.push);
  return (
    <PanelChrome title="Ваучеры" showBack>
      <div className="p-4 text-sm">
        <Card className="rounded-2xl">
          <Card.Content className="space-y-3 p-4">
            <p className="text-muted">
              Ваучер позволяет получить возврат торговых комиссий прямо на ваш
              торговый баланс.
            </p>
            <Button
              variant="outline"
              fullWidth
              onPress={() =>
                push({
                  title: "Как работают ваучеры?",
                  description: "Каждая сделка генерирует 10% возврата комиссии. Ваучеры активны 30 дней.",
                  tone: "info",
                  ttl: 6000,
                })
              }
            >
              Как работают ваучеры?
            </Button>
          </Card.Content>
        </Card>
      </div>
    </PanelChrome>
  );
}

export function EarnAirdrops() {
  const drill = useUI((s) => s.drillPanel);
  const setAirdrop = useUI((s) => s.setSelectedAirdropId);
  return (
    <PanelChrome title="Эйрдропы" showBack>
      <div className="space-y-2 p-4">
        {AIRDROPS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setAirdrop(a.id);
              drill("earn-airdrop-detail");
            }}
            className="block w-full rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-secondary"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{a.name}</div>
              <Icon icon="gravity-ui:chevron-right" className="size-4 text-muted" />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
              <span>{a.startDate} — {a.endDate}</span>
              <span className="rounded-full bg-surface-secondary px-2 py-0.5">
                {a.status === "completed" ? "Завершено" : "Активно"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </PanelChrome>
  );
}

export function EarnAirdropDetail() {
  const id = useUI((s) => s.selectedAirdropId);
  const airdrop = AIRDROPS.find((a) => a.id === id) ?? AIRDROPS[0];
  return (
    <PanelChrome title={airdrop.name} showBack>
      <div className="space-y-4 p-4 text-sm">
        <Card className="rounded-2xl border-accent/30 bg-accent/5">
          <Card.Content className="p-4">
            <div className="text-xs text-muted">Призовой фонд</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              ${usd(airdrop.prizeUsd)}
            </div>
            <div className="text-xs text-muted">USDT</div>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Content className="space-y-3 p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Условия</div>
            <ol className="ml-4 list-decimal space-y-2 text-sm text-foreground/80">
              <li>Зарегистрируйся на Walbi (реферальная ссылка или промокод)</li>
              <li>Внеси депозит ≥ $50 — каждые $50 = дополнительный множитель</li>
              <li>Запусти любого AI-агента или открой сделку в терминале</li>
            </ol>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Content className="space-y-2 p-4 text-xs">
            <Row k="Период" v={`${airdrop.startDate} — ${airdrop.endDate}`} />
            <Row k="Победителей" v="10 крупных + 50 случайных" />
            <Row k="Статус" v={airdrop.status === "completed" ? "Завершён" : "Активен"} />
          </Card.Content>
        </Card>
      </div>
    </PanelChrome>
  );
}

export function EarnTasks() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const push = useToasts((s) => s.push);
  const tasks = EARN_TASKS.filter((t) => filter === "all" || t.status === filter);

  return (
    <PanelChrome title="Задачи" showBack>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-1 rounded-xl bg-surface-secondary p-1 text-xs">
          {([
            ["all", "Все"],
            ["active", "Активно"],
            ["completed", "Завершено"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={[
                "flex-1 rounded-lg px-3 py-1.5 transition-colors",
                filter === k ? "bg-surface" : "text-muted",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {tasks.map((t) => (
            <Card key={t.id} className="rounded-2xl">
              <Card.Content className="flex items-start gap-3 p-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-secondary">
                  <Icon
                    icon={t.status === "completed" ? "gravity-ui:check-shape" : "gravity-ui:trophy"}
                    className={t.status === "completed" ? "size-4 text-success" : "size-4 text-warning"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{t.title}</div>
                  <p className="text-[11px] text-muted">{t.description}</p>
                </div>
                <div className="text-right">
                  {t.cta ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() =>
                        push({title: t.title, description: "Выполни задачу чтобы получить награду", tone: "info"})
                      }
                    >
                      {t.cta}
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-accent">
                      {t.rewardPts.toLocaleString("ru-RU")} PTS
                    </span>
                  )}
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </PanelChrome>
  );
}

function HubRow({
  icon,
  title,
  hint,
  badge,
  onClick,
}: {
  icon: string;
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
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-secondary">
        <Icon icon={icon} className="size-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted">{hint}</div>
      </div>
      {badge ? (
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
          {badge}
        </span>
      ) : null}
      <Icon icon="gravity-ui:chevron-right" className="size-4 text-muted" />
    </button>
  );
}

function Row({k, v}: {k: string; v: string}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}
