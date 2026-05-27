import {useState} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {Icon} from "@iconify/react";

import {PairStrip} from "../components/Trade/PairStrip";
import {CandleChart} from "../components/Trade/CandleChart";
import {OrderBook} from "../components/Trade/OrderBook";
import {OrderForm} from "../components/Trade/OrderForm";
import {PositionsTable} from "../components/Trade/PositionsTable";
import {useUI} from "../store/ui";
import {useToasts} from "../store/toast";
import {PAIRS} from "../lib/mock/data";
import {priceFmt, pct, usdCompact} from "../lib/format";

export const Route = createFileRoute("/trade")({
  component: TradePage,
});

const TIMEFRAMES = [
  {key: "1m", sec: 60},
  {key: "5m", sec: 300},
  {key: "15m", sec: 900},
  {key: "1H", sec: 3600},
  {key: "4H", sec: 14400},
  {key: "1D", sec: 86400},
  {key: "1W", sec: 604800},
] as const;

function TradePage() {
  const pair = useUI((s) => s.currentPair);
  const pairData = PAIRS.find((p) => p.symbol === pair)!;
  const up = pairData.change24h >= 0;
  const push = useToasts((s) => s.push);
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>(TIMEFRAMES[3]);
  const favorite = useUI((s) => s.isFavorite(pair));
  const toggleFavorite = useUI((s) => s.toggleFavorite);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-3 py-4">
      {/* Editorial pair strip + ticker header */}
      <header className="flex flex-col gap-3 border-b border-separator pb-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="eyebrow">Терминал · {pair}</div>
          <div className="flex items-baseline gap-3">
            <span
              className={[
                "mono text-[34px] font-medium leading-none tracking-tight tabular-nums",
                up ? "text-success" : "text-danger",
              ].join(" ")}
            >
              {priceFmt(pairData.price)}
            </span>
            <span
              className={[
                "mono text-[13px] tabular-nums",
                up ? "text-success" : "text-danger",
              ].join(" ")}
            >
              {pct(pairData.change24h)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[12px]">
          <StatInline label="24ч объём" value={usdCompact(pairData.volume24h)} />
          <StatInline label="Макс. плечо" value={`×${pairData.maxLeverage}`} />
          <button
            onClick={() => {
              toggleFavorite(pair);
              push({
                title: favorite ? "Удалено из избранного" : `${pair} в избранном`,
                tone: "info",
                ttl: 2000,
              });
            }}
            className="flex items-center gap-1 text-mute-2 transition-colors hover:text-foreground"
          >
            <Icon
              icon={favorite ? "ph:star-fill" : "ph:star-bold"}
              className={["size-3.5", favorite ? "text-accent" : ""].join(" ")}
            />
            {favorite ? "Избранное" : "+ Избранное"}
          </button>
        </div>
      </header>

      <PairStrip />

      <div className="grid gap-3 md:grid-cols-[1fr_220px_280px]">
        {/* Chart */}
        <div className="overflow-hidden border border-separator">
          <div className="flex items-center gap-3 border-b border-separator px-3 py-2 font-mono text-[11px] text-mute-2">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTf(t)}
                className={[
                  "tabular-nums transition-colors",
                  tf.key === t.key ? "text-foreground underline underline-offset-4" : "hover:text-foreground",
                ].join(" ")}
              >
                {t.key}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-2">
              <button
                onClick={() =>
                  push({title: "Индикаторы", description: "RSI / MACD / EMA скоро", tone: "info"})
                }
                className="p-1 hover:text-foreground"
                aria-label="Индикаторы"
                title="Индикаторы"
              >
                <Icon icon="ph:wave-square-bold" className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen();
                  else document.documentElement.requestFullscreen?.().catch(() => {});
                }}
                className="p-1 hover:text-foreground"
                aria-label="Полный экран"
                title="Полный экран"
              >
                <Icon icon="ph:arrows-out-bold" className="size-3.5" />
              </button>
            </span>
          </div>
          <div className="h-[420px]">
            <CandleChart pair={pair} height={420} size={tf.sec} />
          </div>
        </div>

        {/* Order book */}
        <div className="border border-separator">
          <div className="flex items-center justify-between border-b border-separator px-3 py-2 font-mono text-[11px] text-mute-2">
            <span>Стакан</span>
            <span>scale 1</span>
          </div>
          <div className="py-2">
            <OrderBook pair={pair} />
          </div>
        </div>

        {/* Order form */}
        <div className="border border-separator">
          <div className="border-b border-separator px-3 py-2 font-mono text-[11px] text-mute-2">
            Открыть позицию
          </div>
          <div className="p-3">
            <OrderForm pair={pair} />
          </div>
        </div>
      </div>

      {/* Positions / Orders / History */}
      <div className="overflow-hidden border border-separator">
        <PositionsTable />
      </div>
    </div>
  );
}

function StatInline({label, value}: {label: string; value: string}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="eyebrow">{label}</span>
      <span className="mono tabular-nums text-foreground">{value}</span>
    </span>
  );
}
