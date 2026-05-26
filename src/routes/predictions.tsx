import {useEffect, useMemo, useState} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {Card, Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {mockPredictionBlocks} from "../lib/mock/data";
import type {PredictionBlock as UiBlock} from "../lib/mock/types";
import type {PredictionBlock as WalbiBlock} from "../lib/api/walbi-types";
import {usd, clockFmt} from "../lib/format";
import {useBalances} from "../store/balances";
import {useToasts} from "../store/toast";
import {subscribePredictionUpdates, openPredictionDeal} from "../lib/api/ws";

export const Route = createFileRoute("/predictions")({
  component: PredictionsPage,
});

// Walbi has a few prediction instruments. UI exposes the first one currently
// served — instrument_id arrives with each block, we just pick the latest
// active for the chosen instrument.
const INSTRUMENTS = [
  {id: 1, label: "BTC / USD", pair: "BTCUSD"},
  {id: 2, label: "ETH / USD", pair: "ETHUSD"},
  {id: 3, label: "SOL / USD", pair: "SOLUSD"},
];

function walbiToUi(b: WalbiBlock): UiBlock {
  const up = parseFloat(b.up_amount_usd) || 0;
  const down = parseFloat(b.down_amount_usd) || 0;
  return {
    id: b.uid,
    pair: "BTCUSD", // pair is inferred from instrument_id on the UI side
    timeframeSec: Math.max(60, Math.round(b.close_at - b.open_at)),
    endsAt: b.close_at * 1000,
    longAmount: up,
    shortAmount: down,
    participants: (b.up_count ?? 0) + (b.down_count ?? 0),
    myShare: 0,
    myPayout: 0,
    status:
      b.status === "settled"
        ? "finished"
        : b.status === "closed"
          ? "settling"
          : "active",
  };
}

function PredictionsPage() {
  const [instrumentId, setInstrumentId] = useState(INSTRUMENTS[0].id);
  const [, force] = useState(0);
  const [bet, setBet] = useState<{
    side: "long" | "short";
    amount: string;
    blockUid: string;
  } | null>(null);

  // Live block stream from WS push 1700/1701
  const [blocks, setBlocks] = useState<UiBlock[]>([]);

  useEffect(() => {
    const off = subscribePredictionUpdates({
      onBlockSnapshot: (snap) => {
        if (snap.instrument_id !== instrumentId) return;
        setBlocks((prev) => upsertBlock(prev, walbiToUi(snap)));
      },
      onBlockUpdate: (partial) => {
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === partial.uid
              ? {
                  ...b,
                  longAmount:
                    partial.up_amount_usd != null
                      ? parseFloat(partial.up_amount_usd) || 0
                      : b.longAmount,
                  shortAmount:
                    partial.down_amount_usd != null
                      ? parseFloat(partial.down_amount_usd) || 0
                      : b.shortAmount,
                  participants:
                    partial.up_count != null && partial.down_count != null
                      ? partial.up_count + partial.down_count
                      : b.participants,
                  status:
                    partial.status === "settled"
                      ? "finished"
                      : partial.status === "closed"
                        ? "settling"
                        : "active",
                }
              : b,
          ),
        );
      },
    });
    return off;
  }, [instrumentId]);

  // Tick countdown
  useEffect(() => {
    const id = window.setInterval(() => force((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Fallback if WS hasn't delivered anything yet
  const fallback = useMemo(() => mockPredictionBlocks(), []);
  const display = blocks.length > 0 ? blocks : fallback;
  const active = display[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Прогнозы
          {blocks.length === 0 ? (
            <span className="ml-2 text-xs font-normal text-muted">(ждём данные…)</span>
          ) : (
            <span className="ml-2 text-xs font-normal text-success">live</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Бинарные прогнозы на короткие интервалы — куда пойдёт цена?
        </p>
      </header>

      <Card className="rounded-2xl">
        <Card.Content className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-surface p-1">
              {INSTRUMENTS.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setInstrumentId(i.id)}
                  className={[
                    "rounded-lg px-3 py-1 text-xs transition-colors",
                    instrumentId === i.id ? "bg-surface-secondary" : "text-muted",
                  ].join(" ")}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>
        </Card.Content>
      </Card>

      <BlockView
        block={active}
        onBet={(side) =>
          setBet({
            side,
            amount: "10",
            blockUid: active.id,
          })
        }
      />

      <section>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted">История</div>
        <div className="space-y-2">
          {display.slice(1).map((b) => (
            <HistoryRow key={b.id} block={b} />
          ))}
        </div>
      </section>

      {bet ? (
        <BetModal
          block={active}
          side={bet.side}
          amount={bet.amount}
          blockUid={bet.blockUid}
          onAmountChange={(v) => setBet({...bet, amount: v})}
          onClose={() => setBet(null)}
        />
      ) : null}
    </div>
  );
}

function upsertBlock(prev: UiBlock[], next: UiBlock): UiBlock[] {
  const i = prev.findIndex((b) => b.id === next.id);
  if (i >= 0) {
    const copy = prev.slice();
    copy[i] = next;
    return copy;
  }
  // newest-first by endsAt
  return [next, ...prev].sort((a, b) => b.endsAt - a.endsAt).slice(0, 8);
}

function BlockView({
  block,
  onBet,
}: {
  block: UiBlock;
  onBet: (side: "long" | "short") => void;
}) {
  const remaining = Math.max(0, block.endsAt - Date.now());
  const total = block.longAmount + block.shortAmount;
  const longShare = total > 0 ? block.longAmount / total : 0.5;
  const status = block.status === "settling" ? "Завершается" : block.status === "finished" ? "Завершён" : "Активный";

  return (
    <Card className="rounded-2xl">
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Блок {block.id.slice(0, 8)}…</div>
            <div className="text-lg font-medium">{status}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">До конца</div>
            <div className="font-mono text-2xl tabular-nums">{clockFmt(remaining)}</div>
          </div>
        </div>

        <div className="flex h-2 overflow-hidden rounded-full bg-surface-secondary">
          <div className="bg-success transition-all duration-500" style={{width: `${longShare * 100}%`}} />
          <div className="bg-danger transition-all duration-500" style={{width: `${(1 - longShare) * 100}%`}} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PoolCard side="long" amount={block.longAmount} share={longShare} />
          <PoolCard side="short" amount={block.shortAmount} share={1 - longShare} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Stat label="Твоя ставка" value={`${block.myShare} USDT`} />
          <Stat label="Потенциал" value={`${block.myPayout} USDT`} />
          <Stat label="Участников" value={String(block.participants)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger-soft" fullWidth onPress={() => onBet("short")} isDisabled={block.status !== "active"}>
            <Icon icon="gravity-ui:arrow-down" className="mr-1" />
            Шорт
          </Button>
          <Button variant="primary" fullWidth onPress={() => onBet("long")} isDisabled={block.status !== "active"}>
            <Icon icon="gravity-ui:arrow-up" className="mr-1" />
            Лонг
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

function PoolCard({side, amount, share}: {side: "long" | "short"; amount: number; share: number}) {
  const isLong = side === "long";
  return (
    <div
      className={[
        "rounded-xl p-3",
        isLong ? "bg-success/10 ring-1 ring-success/20" : "bg-danger/10 ring-1 ring-danger/20",
      ].join(" ")}
    >
      <div className={["text-[10px] uppercase tracking-wide", isLong ? "text-success" : "text-danger"].join(" ")}>
        {isLong ? "Лонг" : "Шорт"}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{usd(amount)} $</div>
      <div className="text-[10px] text-muted">{Math.round(share * 100)}% пула</div>
    </div>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-lg bg-surface-secondary p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function HistoryRow({block}: {block: UiBlock}) {
  const total = block.longAmount + block.shortAmount;
  const longShare = total > 0 ? block.longAmount / total : 0.5;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2 text-xs">
      <span className="text-muted">{block.id.slice(0, 8)}…</span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-secondary">
          <div className="flex h-full">
            <div className="bg-success" style={{width: `${longShare * 100}%`}} />
            <div className="bg-danger" style={{width: `${(1 - longShare) * 100}%`}} />
          </div>
        </div>
      </div>
      <span className="tabular-nums text-muted">${total.toFixed(0)}</span>
      {block.outcome ? (
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            block.outcome === "long" ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
          ].join(" ")}
        >
          {block.outcome === "long" ? "Лонг" : "Шорт"}
        </span>
      ) : null}
    </div>
  );
}

function BetModal({
  block,
  side,
  amount,
  blockUid,
  onAmountChange,
  onClose,
}: {
  block: UiBlock;
  side: "long" | "short";
  amount: string;
  blockUid: string;
  onAmountChange: (v: string) => void;
  onClose: () => void;
}) {
  const num = parseFloat(amount) || 0;
  const opposite = side === "long" ? block.shortAmount : block.longAmount;
  const same = side === "long" ? block.longAmount : block.shortAmount;
  const myShare = num > 0 ? num / (same + num) : 0;
  const payout = (same + num + opposite) * myShare;
  const [pending, setPending] = useState(false);

  const push = useToasts((s) => s.push);
  const accountId = useBalances.getState().byGroup.funding?.account_id ?? useBalances.getState().byGroup.trading?.account_id;

  async function submit() {
    if (num <= 0) return;
    if (!accountId) {
      push({tone: "danger", title: "Нет торгового счёта"});
      return;
    }
    setPending(true);
    try {
      const direction = side === "long" ? "up" : "down";
      await openPredictionDeal({
        account_id: accountId,
        block_uid: blockUid,
        amount: num.toString(),
        direction,
      });
      push({
        tone: "success",
        title: `Ставка ${side === "long" ? "Лонг" : "Шорт"} принята`,
        description: `${num} USDT · блок ${blockUid.slice(0, 8)}…`,
      });
      onClose();
    } catch (err) {
      push({
        tone: "danger",
        title: "Ставка не принята",
        description: String((err as Error)?.message ?? err),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        className="walbi-fade-in w-full max-w-md rounded-t-3xl border border-border bg-background p-4 md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">
            Ставка{" "}
            <span className={side === "long" ? "text-success" : "text-danger"}>
              {side === "long" ? "Лонг" : "Шорт"}
            </span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-surface-secondary" aria-label="Закрыть">
            <Icon icon="gravity-ui:xmark" className="size-5" />
          </button>
        </div>

        <label className="block">
          <div className="mb-1 text-xs text-muted">Сумма</div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
            <input
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="flex-1 bg-transparent text-lg outline-none"
              inputMode="decimal"
            />
            <span className="text-xs text-muted">USDT</span>
          </div>
        </label>

        <div className="my-3 space-y-1 rounded-xl border border-border bg-surface p-3 text-xs">
          <Row k="Твоя доля пула" v={`${(myShare * 100).toFixed(1)}%`} />
          <Row k="Потенциальный выигрыш" v={`${payout.toFixed(2)} USDT`} tone="success" />
          <Row k="Если ошибёшься" v={`−${num.toFixed(2)} USDT`} tone="danger" />
        </div>

        <Button
          variant="primary"
          fullWidth
          onPress={submit}
          isPending={pending}
          isDisabled={pending || num <= 0}
        >
          {pending ? "Отправляю…" : "Подтвердить ставку"}
        </Button>
      </div>
    </div>
  );
}

function Row({k, v, tone}: {k: string; v: string; tone?: "success" | "danger"}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <span className={tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""}>
        {v}
      </span>
    </div>
  );
}
