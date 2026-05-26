import {createFileRoute} from "@tanstack/react-router";
import {Card} from "@heroui/react";
import {Icon} from "@iconify/react";

import {PairStrip} from "../components/Trade/PairStrip";
import {CandleChart} from "../components/Trade/CandleChart";
import {OrderBook} from "../components/Trade/OrderBook";
import {OrderForm} from "../components/Trade/OrderForm";
import {PositionsTable} from "../components/Trade/PositionsTable";
import {useUI} from "../store/ui";
import {PAIRS} from "../lib/mock/data";
import {priceFmt, pct, usdCompact} from "../lib/format";

export const Route = createFileRoute("/trade")({
  component: TradePage,
});

function TradePage() {
  const pair = useUI((s) => s.currentPair);
  const pairData = PAIRS.find((p) => p.symbol === pair)!;
  const up = pairData.change24h >= 0;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2 p-2 md:p-3">
      <PairStrip />

      {/* Top stat strip */}
      <div className="hidden items-center gap-6 rounded-2xl bg-surface px-4 py-2 text-xs md:flex">
        <div>
          <div className="text-muted">Цена</div>
          <div className={["text-base font-semibold tabular-nums", up ? "text-success" : "text-danger"].join(" ")}>
            {priceFmt(pairData.price)}
          </div>
        </div>
        <Stat label="24ч изменение" value={pct(pairData.change24h)} tone={up ? "success" : "danger"} />
        <Stat label="24ч объём" value={usdCompact(pairData.volume24h)} />
        <Stat label="Макс. плечо" value={`×${pairData.maxLeverage}`} />
        <button className="ml-auto flex items-center gap-1 text-muted hover:text-foreground">
          <Icon icon="gravity-ui:star" className="size-4" />
          В избранное
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_240px_300px]">
        {/* Chart */}
        <Card className="overflow-hidden rounded-2xl">
          <div className="flex items-center gap-1 border-b border-border px-3 py-1.5 text-[11px] text-muted">
            {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map((tf) => (
              <button
                key={tf}
                className={[
                  "rounded px-2 py-0.5 transition-colors",
                  tf === "1H" ? "bg-surface-secondary text-foreground" : "hover:bg-surface-secondary",
                ].join(" ")}
              >
                {tf}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-2">
              <button className="rounded p-1 hover:bg-surface-secondary" aria-label="Индикаторы">
                <Icon icon="gravity-ui:bars-ascending-align-center" className="size-4" />
              </button>
              <button className="rounded p-1 hover:bg-surface-secondary" aria-label="Полный экран">
                <Icon icon="gravity-ui:square-arrow-up-right" className="size-4" />
              </button>
            </span>
          </div>
          <div className="h-[420px]">
            <CandleChart pair={pair} height={420} />
          </div>
        </Card>

        {/* Order book */}
        <Card className="rounded-2xl">
          <div className="flex items-center justify-between px-3 pt-3 text-xs text-muted">
            <span>Стакан</span>
            <button className="flex items-center gap-1 text-muted">
              0.01 <Icon icon="gravity-ui:chevrons-up-down" className="size-3" />
            </button>
          </div>
          <div className="p-2">
            <OrderBook pair={pair} />
          </div>
        </Card>

        {/* Order form */}
        <Card className="rounded-2xl">
          <div className="border-b border-border px-3 py-2 text-sm">Открыть позицию</div>
          <div className="p-3">
            <OrderForm pair={pair} />
          </div>
        </Card>
      </div>

      {/* Positions / Orders / History */}
      <Card className="overflow-hidden rounded-2xl">
        <PositionsTable />
      </Card>
    </div>
  );
}

function Stat({label, value, tone}: {label: string; value: string; tone?: "success" | "danger"}) {
  return (
    <div>
      <div className="text-muted">{label}</div>
      <div className={["font-semibold tabular-nums", tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""].join(" ")}>
        {value}
      </div>
    </div>
  );
}
