import {useState} from "react";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {PAIRS} from "../../lib/mock/data";
import {priceFmt, usd} from "../../lib/format";
import {usePositions} from "../../store/positions";
import {useBalances} from "../../store/balances";
import {useToasts} from "../../store/toast";
import {openDeal} from "../../lib/api/ws";
import type {Position} from "../../lib/mock/types";

type OrderType = "market" | "limit";
type Side = "long" | "short";

export function OrderForm({pair}: {pair: string}) {
  const pairData = PAIRS.find((p) => p.symbol === pair);
  const [type, setType] = useState<OrderType>("market");
  const [amount, setAmount] = useState("0");
  const [leverage, setLeverage] = useState(5);
  const [limitPrice, setLimitPrice] = useState(
    pairData ? priceFmt(pairData.price) : "0",
  );
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpPct, setTpPct] = useState("32");
  const [slPct, setSlPct] = useState("13");
  const [isolated, setIsolated] = useState(true);
  const [pending, setPending] = useState<Side | null>(null);

  const addPosition = usePositions((s) => s.add);
  const pushToast = useToasts((s) => s.push);

  const num = parseFloat(amount) || 0;
  const fee = num * 0.001;
  const valid = num >= 1 && pairData != null;

  async function openPosition(side: Side) {
    if (!valid || !pairData) return;
    setPending(side);

    const entry =
      type === "limit" ? parseFloat(limitPrice) || pairData.price : pairData.price;

    // Pick the trading-group account. WALBI requires a trading account_id —
    // pull from the live balances store.
    const tradingGroup = useBalances.getState().byGroup.trading
      ?? useBalances.getState().byGroup.fx
      ?? useBalances.getState().byGroup.funding;
    if (!tradingGroup) {
      pushToast({
        title: "Нет торгового счёта",
        description: "Открой Кошелёк → Создать торговый аккаунт",
        tone: "danger",
      });
      setPending(null);
      return;
    }

    try {
      const deal = await openDeal({
        account_id: tradingGroup.account_id,
        pair,
        amount: num.toString(),
        dir: side,
        multiplicator: leverage,
        margin_type: isolated ? "isolated" : "cross",
        group: tradingGroup.group,
        ...(tpEnabled
          ? {take_profit: {type: "percent", value: tpPct}}
          : {}),
        ...(slEnabled
          ? {stop_loss: {type: "percent", value: slPct, trailing: false, trailing_step: 0}}
          : {}),
      });

      // Optimistic: add to local store. The WS push will replace it shortly.
      const pos: Position = {
        id: `walbi-${deal.id ?? Date.now()}`,
        pair,
        side,
        size: num,
        entryPrice: deal.price_open ?? entry,
        markPrice: deal.price_current ?? entry,
        leverage,
        pnl: parseFloat(deal.floating_pnl ?? "0") || 0,
        pnlPct: 0,
        liquidationPrice: deal.stop_out_price ?? 0,
      };
      addPosition(pos);
      pushToast({
        title: `${side === "long" ? "Лонг" : "Шорт"} ${pair} открыт`,
        description: `${usd(num)} ${pairData.quote} · плечо ×${leverage} · вход ${priceFmt(deal.price_open ?? entry)}`,
        tone: "success",
      });
      setAmount("0");
    } catch (err) {
      pushToast({
        title: `${side === "long" ? "Лонг" : "Шорт"} не открыт`,
        description: String((err as Error)?.message ?? err),
        tone: "danger",
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* Margin mode */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsolated((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-surface-secondary px-2.5 py-1 text-xs"
        >
          {isolated ? "Изол." : "Кросс"}
          <Icon icon="gravity-ui:chevrons-up-down" className="size-3 text-muted" />
        </button>
        <button className="rounded-lg p-1.5 text-muted hover:bg-surface-secondary" aria-label="Настройки">
          <Icon icon="gravity-ui:gear" className="size-4" />
        </button>
      </div>

      {/* Order type */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-secondary p-1">
        {(["market", "limit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs transition-colors",
              type === t ? "bg-surface" : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            {t === "market" ? "Рынок" : "Лимит"}
          </button>
        ))}
      </div>

      {/* Limit price field */}
      {type === "limit" ? (
        <Field
          label="Цена"
          value={limitPrice}
          onChange={setLimitPrice}
          suffix="USDT"
        />
      ) : null}

      {/* Amount */}
      <Field
        label="Сумма"
        value={amount}
        onChange={setAmount}
        suffix={pairData?.quote ?? "USDT"}
      />

      {/* Quick-fill chips */}
      <div className="grid grid-cols-4 gap-1.5">
        {[10, 25, 50, 100].map((p) => (
          <button
            key={p}
            onClick={() => setAmount(((5554.2 * p) / 100).toFixed(2))}
            className="rounded-lg bg-surface-secondary px-2 py-1 text-[11px] text-muted transition-colors hover:text-foreground"
          >
            {p}%
          </button>
        ))}
      </div>

      {/* Leverage slider */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted">Плечо</span>
          <span className="font-mono">×{leverage}</span>
        </div>
        <input
          type="range"
          min={1}
          max={pairData?.maxLeverage ?? 50}
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="walbi-slider w-full"
        />
        <div className="mt-1 grid grid-cols-5 gap-1 text-[10px] text-muted">
          {[1, 5, 10, 25, pairData?.maxLeverage ?? 50].map((m) => (
            <button
              key={m}
              onClick={() => setLeverage(m)}
              className="hover:text-foreground"
            >
              ×{m}
            </button>
          ))}
        </div>
      </div>

      {/* Inline TP/SL */}
      <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
        <Toggle
          label="Take Profit"
          checked={tpEnabled}
          onChange={setTpEnabled}
        >
          <input
            type="number"
            value={tpPct}
            onChange={(e) => setTpPct(e.target.value)}
            className="w-12 rounded bg-surface-secondary px-1.5 py-0.5 text-right text-xs text-success"
          />
          <span className="text-xs text-muted">%</span>
        </Toggle>
        <Toggle
          label="Stop Loss"
          checked={slEnabled}
          onChange={setSlEnabled}
        >
          <input
            type="number"
            value={slPct}
            onChange={(e) => setSlPct(e.target.value)}
            className="w-12 rounded bg-surface-secondary px-1.5 py-0.5 text-right text-xs text-danger"
          />
          <span className="text-xs text-muted">%</span>
        </Toggle>
      </div>

      {/* Stats */}
      <div className="space-y-1 rounded-xl border border-border bg-surface p-3 text-xs">
        <Stat label="Объём" value={`${usd(num * leverage)} ${pairData?.quote ?? "USDT"}`} />
        <Stat label="Комиссия" value={`${fee.toFixed(4)} USDT`} />
        <Stat
          label="Цена ликвидации (лонг)"
          value={`${priceFmt((pairData?.price ?? 0) * (1 - 1 / leverage))}`}
          tone="warning"
        />
      </div>

      {/* Validation */}
      {!valid ? (
        <p className="rounded-lg border border-warning/30 bg-warning/5 px-2 py-1.5 text-[11px] text-warning">
          Введите сумму больше 1,00 USDT
        </p>
      ) : null}

      {/* CTA */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="primary"
          isDisabled={!valid || pending !== null}
          isPending={pending === "long"}
          onPress={() => void openPosition("long")}
        >
          {pending === "long" ? "Открываю…" : "Открыть Лонг"}
        </Button>
        <Button
          variant="danger"
          isDisabled={!valid || pending !== null}
          isPending={pending === "short"}
          onPress={() => void openPosition("short")}
        >
          {pending === "short" ? "Открываю…" : "Открыть Шорт"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-muted">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {suffix ? <span className="text-xs text-muted">{suffix}</span> : null}
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-xs">
        <span
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={[
            "relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors",
            checked ? "bg-accent" : "bg-surface-secondary",
          ].join(" ")}
        >
          <span
            className={[
              "absolute h-3 w-3 rounded-full bg-foreground transition-transform",
              checked ? "translate-x-3.5" : "translate-x-0.5",
            ].join(" ")}
          />
        </span>
        {label}
      </label>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function Stat({label, value, tone}: {label: string; value: string; tone?: "warning"}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={tone === "warning" ? "text-warning" : ""}>{value}</span>
    </div>
  );
}
