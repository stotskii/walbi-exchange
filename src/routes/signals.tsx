import {useMemo, useState} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {motion, useMotionValue, useTransform, type PanInfo} from "framer-motion";
import {Button, Card} from "@heroui/react";
import {Icon} from "@iconify/react";

import {mockSignals, PAIRS} from "../lib/mock/data";
import type {SignalCard, Position} from "../lib/mock/types";
import {AgentAvatar} from "../components/AIHub/AgentAvatar";
import {relativeTime, priceFmt, pct} from "../lib/format";
import {usePositions} from "../store/positions";
import {useToasts} from "../store/toast";

export const Route = createFileRoute("/signals")({
  component: SignalsPage,
});

const ONBOARDING_STEPS = [
  {emoji: "👆", title: "Свайпай карточки", description: "Влево — пропустить, вправо — открыть позицию"},
  {emoji: "🤖", title: "Включай авто-торговлю", description: "Тогда будущие сигналы агента откроют позиции сами"},
  {emoji: "📈", title: "Зарабатывай", description: "Лучшие сигналы — от агентов с высоким APR"},
];

const SIGNAL_PREFIX = "p-sig-";

function SignalsPage() {
  const all = useMemo(() => mockSignals(), []);
  const [index, setIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(
    () => typeof window !== "undefined" && !window.localStorage.getItem("walbi:signals-onboarded"),
  );
  const [onboardStep, setOnboardStep] = useState(0);
  const [tab, setTab] = useState<"feed" | "positions">("feed");

  const addPosition = usePositions((s) => s.add);
  const positions = usePositions((s) => s.positions);
  const closePosition = usePositions((s) => s.close);
  const push = useToasts((s) => s.push);

  // positions opened via signals (tagged by id prefix)
  const signalPositions = positions.filter((p) => p.id.startsWith(SIGNAL_PREFIX));

  function dismissOnboarding() {
    window.localStorage.setItem("walbi:signals-onboarded", "1");
    setShowOnboarding(false);
  }

  function handleAction(s: SignalCard, dir: "long" | "short" | "skip") {
    if (dir === "skip") {
      setIndex((i) => i + 1);
      return;
    }

    const pairSymbol = s.pair.toUpperCase().endsWith("USD") ? s.pair.toUpperCase() : `${s.pair.toUpperCase()}USD`;
    const pairData = PAIRS.find((p) => p.symbol === pairSymbol);
    const entry = pairData?.price ?? s.amountUsdt / s.leverage;
    const liq =
      dir === "long"
        ? +(entry * (1 - 1 / s.leverage)).toFixed(entry < 1 ? 6 : 2)
        : +(entry * (1 + 1 / s.leverage)).toFixed(entry < 1 ? 6 : 2);

    const pos: Position = {
      id: `${SIGNAL_PREFIX}${Date.now()}`,
      pair: pairSymbol,
      side: dir,
      size: s.amountUsdt,
      entryPrice: entry,
      markPrice: entry,
      leverage: s.leverage,
      pnl: 0,
      pnlPct: 0,
      liquidationPrice: liq,
    };
    addPosition(pos);
    push({
      tone: "success",
      title: `${dir === "long" ? "Лонг" : "Шорт"} ${pairSymbol} открыт`,
      description: `По сигналу ${s.agentName} · ${s.amountUsdt} USDT · ×${s.leverage}`,
    });
    setIndex((i) => i + 1);
  }

  if (showOnboarding) {
    const step = ONBOARDING_STEPS[onboardStep];
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 p-6 text-center" style={{minHeight: "calc(100svh - 112px)"}}>
        <div className="walbi-fade-in flex flex-col items-center gap-3">
          <div className="text-6xl">{step.emoji}</div>
          <h2 className="text-2xl font-semibold">{step.title}</h2>
          <p className="text-sm text-muted">{step.description}</p>
        </div>

        <div className="flex gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <span
              key={i}
              className={[
                "h-1 rounded-full transition-all",
                i === onboardStep ? "w-6 bg-accent" : "w-1.5 bg-surface-secondary",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onPress={() =>
              onboardStep === ONBOARDING_STEPS.length - 1
                ? dismissOnboarding()
                : setOnboardStep((v) => v + 1)
            }
          >
            {onboardStep === ONBOARDING_STEPS.length - 1 ? "Начать" : "Дальше"}
          </Button>
          <button
            onClick={dismissOnboarding}
            className="text-xs text-muted hover:text-foreground"
          >
            Пропустить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Сигналы</h1>
        <div className="flex items-center gap-1 rounded-xl bg-surface p-1 text-xs">
          {(["feed", "positions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-1 transition-colors",
                tab === t ? "bg-surface-secondary" : "text-muted",
              ].join(" ")}
            >
              {t === "feed" ? "Лента" : "Позиции"}
              {t === "positions" && signalPositions.length > 0 ? (
                <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                  {signalPositions.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {tab === "feed" ? (
        <div className="relative" style={{minHeight: 480}}>
          {all.slice(index, index + 3).reverse().map((s, idx) => (
            <SwipeCard
              key={s.id}
              signal={s}
              offsetIdx={all.slice(index, index + 3).length - 1 - idx}
              onSwipe={(dir) => handleAction(s, dir)}
            />
          ))}
          {index >= all.length ? (
            <Card className="absolute inset-x-0 top-0 rounded-2xl">
              <Card.Content className="p-8 text-center">
                <div className="text-4xl">🎉</div>
                <div className="mt-2 font-medium">Сигналы закончились</div>
                <p className="mt-1 text-xs text-muted">
                  Подожди новых сигналов от агентов или подпишись на маркетплейс
                </p>
                <Button variant="primary" size="sm" className="mt-3" onPress={() => setIndex(0)}>
                  Заново
                </Button>
              </Card.Content>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {signalPositions.length === 0 ? (
            <Card className="rounded-2xl">
              <Card.Content className="p-8 text-center text-sm text-muted">
                Открытых позиций по сигналам нет. Свайпни сигнал вправо чтобы открыть.
              </Card.Content>
            </Card>
          ) : (
            signalPositions.map((p) => (
              <Card key={p.id} className="rounded-2xl">
                <Card.Content className="p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-xs">{p.pair}</span>
                      <span className={p.side === "long" ? "text-success" : "text-danger"}>
                        {p.side === "long" ? "Лонг" : "Шорт"}
                      </span>
                      <span className="text-xs text-muted">×{p.leverage}</span>
                    </div>
                    <span className={p.pnl >= 0 ? "text-success" : "text-danger"}>
                      {p.pnl.toFixed(2)} ({pct(p.pnlPct)})
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted">
                    <div>Размер: {p.size}</div>
                    <div>Вход: {priceFmt(p.entryPrice)}</div>
                    <div>Ликвид: {priceFmt(p.liquidationPrice)}</div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="danger-soft"
                      fullWidth
                      onPress={() => {
                        closePosition(p.id);
                        push({title: `${p.pair} закрыта`, tone: p.pnl >= 0 ? "success" : "danger"});
                      }}
                    >
                      Закрыть
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SwipeCard({
  signal,
  offsetIdx,
  onSwipe,
}: {
  signal: SignalCard;
  offsetIdx: number;
  onSwipe: (dir: "long" | "short" | "skip") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const longGlow = useTransform(x, [0, 150], [0, 1]);
  const shortGlow = useTransform(x, [-150, 0], [1, 0]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > 120) onSwipe("long");
    else if (info.offset.x < -120) onSwipe("short");
    else if (Math.abs(info.offset.y) > 120) onSwipe("skip");
  }

  const isTop = offsetIdx === 0;
  const sideClass = signal.side === "long" ? "text-success" : "text-danger";

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{left: 0, right: 0, top: 0, bottom: 0}}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{
        x: isTop ? x : undefined,
        rotate: isTop ? rotate : undefined,
        scale: 1 - offsetIdx * 0.04,
        y: offsetIdx * 12,
        zIndex: 100 - offsetIdx,
      }}
      className="absolute inset-x-0 top-0 cursor-grab active:cursor-grabbing"
    >
      <Card className="rounded-2xl">
        <Card.Content className="relative space-y-3 p-4">
          <motion.div
            style={{opacity: longGlow}}
            className="absolute right-3 top-3 rounded-lg border-2 border-success px-3 py-1 text-xs font-bold uppercase text-success"
          >
            Лонг ↗
          </motion.div>
          <motion.div
            style={{opacity: shortGlow}}
            className="absolute left-3 top-3 rounded-lg border-2 border-danger px-3 py-1 text-xs font-bold uppercase text-danger"
          >
            Шорт ↙
          </motion.div>

          <div className="flex items-center gap-3">
            <AgentAvatar name={signal.agentName} size={36} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">AI-агент · {signal.agentName}</div>
              <div className="text-[10px] text-muted">{relativeTime(signal.postedAt)}</div>
            </div>
            {signal.autoTrade ? (
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
                ✓ Авто-торговля
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-surface-secondary px-2.5 py-1 text-xs font-medium">
              {signal.pair}
            </span>
            <span className={["text-sm font-semibold", sideClass].join(" ")}>
              {signal.side === "long" ? "Лонг" : "Шорт"}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-foreground/85">{signal.text}</p>

          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <Stat label="Размер" value={`${signal.amountUsdt}`} />
            <Stat label="Плечо" value={`×${signal.leverage}`} />
            <Stat label="TP" value={`+${(signal.takeProfitPct * 100).toFixed(0)}%`} tone="success" />
            <Stat label="SL" value={`−${(signal.stopLossPct * 100).toFixed(0)}%`} tone="danger" />
          </div>

          {isTop ? (
            <div className="flex gap-2 pt-1">
              <Button variant="outline" fullWidth size="sm" onPress={() => onSwipe("skip")}>
                Пропустить
              </Button>
              <Button
                variant={signal.side === "long" ? "primary" : "danger"}
                fullWidth
                size="sm"
                onPress={() => onSwipe(signal.side)}
              >
                <Icon icon={signal.side === "long" ? "gravity-ui:arrow-up" : "gravity-ui:arrow-down"} className="mr-1" />
                {signal.side === "long" ? "Открыть лонг" : "Открыть шорт"}
              </Button>
            </div>
          ) : null}
        </Card.Content>
      </Card>
    </motion.div>
  );
}

function Stat({label, value, tone}: {label: string; value: string; tone?: "success" | "danger"}) {
  return (
    <div className="rounded-lg bg-surface-secondary p-1.5">
      <div className="text-[9px] uppercase tracking-wide text-muted">{label}</div>
      <div className={["text-xs font-semibold", tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""].join(" ")}>
        {value}
      </div>
    </div>
  );
}
