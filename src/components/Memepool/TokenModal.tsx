import {useEffect, useRef, useState} from "react";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type AreaData,
  type Time,
} from "lightweight-charts";

import type {MemecoinToken} from "../../lib/mock/types";
import {priceFmt, usdCompact, pct} from "../../lib/format";
import {useBalances} from "../../store/balances";
import {useToasts} from "../../store/toast";
import {api} from "../../lib/api/rest";

export function TokenModal({
  token,
  address,
  onClose,
}: {
  token: MemecoinToken;
  /** WALBI on-chain token address (Solana for now) */
  address?: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("0");
  const [pending, setPending] = useState(false);

  const balances = useBalances((s) => s.accounts);
  const push = useToasts((s) => s.push);

  const memepoolBalance = balances.memepool ?? 0;
  const memepoolAccountId = useBalances.getState().byGroup.memepool?.account_id;
  const num = parseFloat(amount) || 0;
  const tokensReceived = num > 0 ? num / token.priceUsd : 0;
  const valid = num >= 1 && (side === "buy" ? num <= memepoolBalance : true);

  async function submit() {
    if (!valid || !address) {
      if (!address) push({tone: "danger", title: "Нет адреса токена"});
      return;
    }
    if (!memepoolAccountId) {
      push({tone: "danger", title: "Не найден Мемепул-счёт", description: "Открой Кошелёк сначала"});
      return;
    }
    setPending(true);
    try {
      if (side === "buy") {
        await api.memepool.buy(address, num.toString(), memepoolAccountId);
        push({
          tone: "success",
          title: `Куплено ${token.symbol}`,
          description: `${tokensReceived.toFixed(4)} ${token.symbol} за ${num.toFixed(2)} USDT`,
        });
      } else {
        await api.memepool.sell(address, num.toString(), memepoolAccountId);
        push({
          tone: "success",
          title: `Продано ${token.symbol}`,
          description: `${num.toFixed(2)} USDT на Мемепул-счёт`,
        });
      }
      onClose();
    } catch (err) {
      push({
        tone: "danger",
        title: `${side === "buy" ? "Покупка" : "Продажа"} не удалась`,
        description: String((err as Error)?.message ?? err),
      });
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height: 240,
      layout: {background: {color: "transparent"}, textColor: "rgba(255,255,255,0.5)", attributionLogo: false},
      grid: {vertLines: {visible: false}, horzLines: {color: "rgba(255,255,255,0.04)"}},
      rightPriceScale: {borderVisible: false},
      timeScale: {borderVisible: false, timeVisible: true},
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: token.changePct >= 0 ? "#22c55e" : "#ef4444",
      topColor: token.changePct >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
      bottomColor: "transparent",
      lineWidth: 2,
    });

    // Walbi doesn't expose memecoin chart history yet — use a smooth synthetic
    // curve seeded by the current price + 24h change as a visual placeholder.
    const now = Math.floor(Date.now() / 1000);
    const endPrice = token.priceUsd;
    const startPrice = endPrice / (1 + token.changePct);
    const data: AreaData[] = [];
    for (let i = 100; i >= 0; i--) {
      const t = (100 - i) / 100;
      const trend = startPrice + (endPrice - startPrice) * t;
      const jitter = trend * 0.005 * (Math.random() - 0.5);
      data.push({time: (now - i * 900) as Time, value: Math.max(0, trend + jitter)});
    }
    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    return () => chart.remove();
  }, [token]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 md:items-center" onClick={onClose}>
      <div
        className="walbi-fade-in flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border border-border bg-background md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-border p-4">
          <span
            className="grid size-10 place-items-center rounded-full text-white"
            style={{backgroundColor: token.iconColor}}
          >
            {token.symbol.slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 truncate text-sm font-semibold">
              {token.name}
              {token.verified ? (
                <Icon icon="gravity-ui:check-shape" className="size-4 text-success" />
              ) : null}
            </div>
            <div className="text-[10px] text-muted">{token.symbol}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-secondary"
            aria-label="Закрыть"
          >
            <Icon icon="gravity-ui:xmark" className="size-5" />
          </button>
        </header>

        <div className="flex items-baseline gap-3 px-4 pt-3">
          <span className="text-2xl font-semibold tabular-nums">
            ${priceFmt(token.priceUsd)}
          </span>
          <span className={token.changePct >= 0 ? "text-success" : "text-danger"}>
            {pct(token.changePct)}
          </span>
        </div>

        <div className="px-4 pt-2">
          <div ref={containerRef} className="h-60 w-full" />
        </div>

        <div className="grid grid-cols-3 gap-3 border-y border-border p-4 text-xs">
          <Stat label="Mkt Cap" value={usdCompact(token.marketCapUsd)} />
          <Stat label="Объём 24ч" value={usdCompact(token.volume24hUsd)} />
          <Stat label="Сеть" value="Solana" />
        </div>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-secondary p-1">
            <button
              onClick={() => setSide("buy")}
              className={[
                "rounded-lg py-1.5 text-sm transition-colors",
                side === "buy" ? "bg-success text-white" : "text-muted",
              ].join(" ")}
            >
              Купить
            </button>
            <button
              onClick={() => setSide("sell")}
              className={[
                "rounded-lg py-1.5 text-sm transition-colors",
                side === "sell" ? "bg-danger text-white" : "text-muted",
              ].join(" ")}
            >
              Продать
            </button>
          </div>

          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Сумма (USDT)</span>
              <span>Мемепул-баланс: {memepoolBalance.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="flex-1 bg-transparent text-base outline-none"
              />
              <span className="text-xs text-muted">USDT</span>
            </div>
          </label>

          {num > 0 ? (
            <div className="rounded-xl border border-border bg-surface p-2 text-center text-xs text-muted">
              ≈ <span className="text-foreground">{tokensReceived.toFixed(4)} {token.symbol}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => setAmount(((memepoolBalance * p) / 100).toFixed(2))}
                className="rounded-lg bg-surface-secondary px-2 py-1 text-[11px] text-muted transition-colors hover:text-foreground"
              >
                {p}%
              </button>
            ))}
          </div>

          {side === "buy" && memepoolBalance < 1 ? (
            <p className="rounded-lg border border-warning/30 bg-warning/5 px-2 py-1.5 text-[11px] text-warning">
              На Мемепул-счёте 0 USDT. Сначала переведи средства в Кошельке → Перевод.
            </p>
          ) : null}

          <Button
            variant="primary"
            fullWidth
            isDisabled={!valid || pending}
            isPending={pending}
            onPress={submit}
          >
            {pending ? "Обработка…" : `${side === "buy" ? "Купить" : "Продать"} ${token.symbol}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
