import {useState, type ReactNode} from "react";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {ASSETS, SUB_ACCOUNTS} from "../../lib/mock/data";
import {useBalances} from "../../store/balances";
import {useToasts} from "../../store/toast";
import type {SubAccount} from "../../lib/mock/types";

export type WalletAction = "deposit" | "withdraw" | "transfer" | "swap";

const TITLES: Record<WalletAction, string> = {
  deposit: "Депозит",
  withdraw: "Вывести",
  transfer: "Перевод",
  swap: "Своп",
};

export function ActionModal({
  action,
  onClose,
}: {
  action: WalletAction;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        className="walbi-fade-in flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-background md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">{TITLES[action]}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-surface-secondary" aria-label="Закрыть">
            <Icon icon="gravity-ui:xmark" className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto p-4">
          {action === "deposit" ? <DepositForm onClose={onClose} /> : null}
          {action === "withdraw" ? <WithdrawForm onClose={onClose} /> : null}
          {action === "transfer" ? <TransferForm onClose={onClose} /> : null}
          {action === "swap" ? <SwapForm onClose={onClose} /> : null}
        </div>
      </div>
    </div>
  );
}

function DepositForm({onClose}: {onClose: () => void}) {
  const [method, setMethod] = useState<"fiat" | "crypto">("crypto");
  const [asset, setAsset] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  const [credit, setCredit] = useState<SubAccount["id"]>("funding");
  const [fiatAmount, setFiatAmount] = useState("100");
  const [pending, setPending] = useState(false);

  const add = useBalances((s) => s.add);
  const push = useToasts((s) => s.push);

  function payFiat() {
    const amt = parseFloat(fiatAmount) || 0;
    if (amt < 10) {
      push({tone: "danger", title: "Минимум $10", description: "Введи сумму побольше"});
      return;
    }
    setPending(true);
    window.setTimeout(() => {
      add(credit, amt);
      push({
        tone: "success",
        title: "Депозит зачислен",
        description: `$${amt.toFixed(2)} на ${SUB_ACCOUNTS.find((s) => s.id === credit)?.name}`,
      });
      setPending(false);
      onClose();
    }, 700);
  }

  function copyAddress() {
    const addr = "TXxJzKqsdfg9D8pVwHrTLY3hZmN5cR4kF6";
    navigator.clipboard.writeText(addr).then(
      () => push({tone: "success", title: "Адрес скопирован", ttl: 2000}),
      () => push({tone: "danger", title: "Не получилось", description: "Скопируй вручную"}),
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-secondary p-1">
        {(["crypto", "fiat"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              method === m ? "bg-surface" : "text-muted",
            ].join(" ")}
          >
            {m === "crypto" ? "Крипто" : "Карта · Onramper"}
          </button>
        ))}
      </div>

      {method === "crypto" ? (
        <>
          <Field label="Актив">
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            >
              {ASSETS.map((a) => (
                <option key={a.symbol} value={a.symbol} className="bg-background">
                  {a.symbol} · {a.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Сеть">
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            >
              {["TRC20", "ERC20", "BSC", "Polygon"].map((n) => (
                <option key={n} value={n} className="bg-background">{n}</option>
              ))}
            </select>
          </Field>

          <Field label="Зачислить на">
            <select
              value={credit}
              onChange={(e) => setCredit(e.target.value as SubAccount["id"])}
              className="w-full bg-transparent text-sm outline-none"
            >
              {SUB_ACCOUNTS.filter((s) => s.actions.includes("deposit")).map((s) => (
                <option key={s.id} value={s.id} className="bg-background">{s.name}</option>
              ))}
            </select>
          </Field>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <div className="mx-auto grid size-32 place-items-center rounded-xl bg-white">
              <Icon icon="gravity-ui:qr-code" className="size-20 text-black" />
            </div>
            <div className="mt-3 break-all font-mono text-xs text-muted">
              TXxJzKqsdfg9D8pVwHrTLY3hZmN5cR4kF6
            </div>
            <button onClick={copyAddress} className="mt-2 text-xs text-accent hover:underline">
              Копировать адрес
            </button>
          </div>

          <p className="text-[10px] text-muted">
            Минимальный депозит: <b>10 USDT</b>. Зачисление после 6 подтверждений сети.
            Не отправляй другие активы — будут потеряны.
          </p>

          <Button
            variant="outline"
            fullWidth
            onPress={() => {
              add(credit, asset === "USDT" ? 100 : 0.1);
              push({
                tone: "success",
                title: "Симулирован депозит",
                description: `+${asset === "USDT" ? "100" : "0.1"} ${asset} на ${SUB_ACCOUNTS.find((s) => s.id === credit)?.name}`,
              });
              onClose();
            }}
          >
            <Icon icon="gravity-ui:bolt" className="mr-1.5 size-3.5" />
            Симулировать получение
          </Button>
        </>
      ) : (
        <>
          <Field label="Сумма">
            <input
              value={fiatAmount}
              onChange={(e) => setFiatAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              inputMode="decimal"
            />
            <span className="text-xs text-muted">USD</span>
          </Field>

          <Field label="Зачислить на">
            <select
              value={credit}
              onChange={(e) => setCredit(e.target.value as SubAccount["id"])}
              className="w-full bg-transparent text-sm outline-none"
            >
              {SUB_ACCOUNTS.filter((s) => s.actions.includes("deposit")).map((s) => (
                <option key={s.id} value={s.id} className="bg-background">{s.name}</option>
              ))}
            </select>
          </Field>

          <p className="text-[10px] text-muted">
            Платёж через <b>Onramper</b>. Комиссия 1,5%. Зачисление мгновенно после оплаты.
          </p>
          <Button
            variant="primary"
            fullWidth
            isPending={pending}
            isDisabled={pending}
            onPress={payFiat}
          >
            {pending ? "Обработка…" : "Перейти к оплате"}
          </Button>
        </>
      )}
    </div>
  );
}

function WithdrawForm({onClose}: {onClose: () => void}) {
  const [from, setFrom] = useState<SubAccount["id"]>("funding");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("0");
  const [pending, setPending] = useState(false);

  const balances = useBalances((s) => s.accounts);
  const withdraw = useBalances((s) => s.withdraw);
  const push = useToasts((s) => s.push);

  const available = balances[from];
  const num = parseFloat(amount) || 0;
  const fee = 1;
  const receive = Math.max(0, num - fee);
  const valid = num > 0 && num <= available && address.trim().length > 8;

  function submit() {
    if (!valid) return;
    setPending(true);
    window.setTimeout(() => {
      withdraw(from, num);
      push({
        tone: "success",
        title: "Заявка на вывод создана",
        description: `${receive.toFixed(2)} USDT → ${address.slice(0, 8)}…`,
      });
      setPending(false);
      onClose();
    }, 800);
  }

  return (
    <div className="space-y-4">
      <Field label="Откуда">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value as SubAccount["id"])}
          className="w-full bg-transparent text-sm outline-none"
        >
          {SUB_ACCOUNTS.filter((s) => s.actions.includes("withdraw")).map((s) => (
            <option key={s.id} value={s.id} className="bg-background">
              {s.name} — {balances[s.id].toFixed(2)} USDT
            </option>
          ))}
        </select>
      </Field>
      <Field label="Актив">
        <span className="text-sm">USDT · Tether</span>
      </Field>
      <Field label="Сеть">
        <span className="text-sm">TRC20</span>
      </Field>
      <Field label="Адрес получателя">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="TXxJz..."
          className="flex-1 bg-transparent font-mono text-xs outline-none"
        />
      </Field>
      <Field label="Сумма">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          inputMode="decimal"
        />
        <button className="text-xs text-accent" onClick={() => setAmount(String(available))}>Макс.</button>
      </Field>
      <div className="space-y-1 rounded-xl border border-border bg-surface p-3 text-xs">
        <Row k="Доступно" v={`${available.toFixed(2)} USDT`} />
        <Row k="Сетевая комиссия" v={`${fee} USDT`} />
        <Row k="К получению" v={receive > 0 ? `${receive.toFixed(2)} USDT` : "—"} />
      </div>
      {num > available ? (
        <p className="rounded-lg border border-warning/30 bg-warning/5 px-2 py-1.5 text-[11px] text-warning">
          Недостаточно средств
        </p>
      ) : null}
      <Button
        variant="primary"
        fullWidth
        isDisabled={!valid || pending}
        isPending={pending}
        onPress={submit}
      >
        {pending ? "Отправляю…" : "Вывести"}
      </Button>
    </div>
  );
}

function TransferForm({onClose}: {onClose: () => void}) {
  const [from, setFrom] = useState<SubAccount["id"]>("funding");
  const [to, setTo] = useState<SubAccount["id"]>("trading");
  const [amount, setAmount] = useState("0");
  const [pending, setPending] = useState(false);

  const balances = useBalances((s) => s.accounts);
  const transfer = useBalances((s) => s.transfer);
  const push = useToasts((s) => s.push);

  const num = parseFloat(amount) || 0;
  const valid = num > 0 && num <= balances[from] && from !== to;

  function submit() {
    if (!valid) return;
    setPending(true);
    window.setTimeout(() => {
      transfer(from, to, num);
      push({
        tone: "success",
        title: "Перевод выполнен",
        description: `${num.toFixed(2)} USDT · ${SUB_ACCOUNTS.find((s) => s.id === from)?.name} → ${SUB_ACCOUNTS.find((s) => s.id === to)?.name}`,
      });
      setPending(false);
      onClose();
    }, 500);
  }

  return (
    <div className="space-y-4">
      <Field label="Откуда">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value as SubAccount["id"])}
          className="w-full bg-transparent text-sm outline-none"
        >
          {SUB_ACCOUNTS.map((s) => (
            <option key={s.id} value={s.id} className="bg-background">
              {s.name} — {balances[s.id].toFixed(2)} USDT
            </option>
          ))}
        </select>
      </Field>
      <div className="flex justify-center">
        <button
          onClick={() => {
            const tmp = from;
            setFrom(to);
            setTo(tmp);
          }}
          className="grid size-9 place-items-center rounded-full bg-surface-secondary hover:bg-surface"
          aria-label="Поменять местами"
        >
          <Icon icon="gravity-ui:arrows-rotate-left" className="size-4" />
        </button>
      </div>
      <Field label="Куда">
        <select
          value={to}
          onChange={(e) => setTo(e.target.value as SubAccount["id"])}
          className="w-full bg-transparent text-sm outline-none"
        >
          {SUB_ACCOUNTS.map((s) => (
            <option key={s.id} value={s.id} className="bg-background">{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Сумма">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          inputMode="decimal"
        />
        <span className="text-xs text-muted">USDT</span>
      </Field>
      {from === to ? (
        <p className="rounded-lg border border-warning/30 bg-warning/5 px-2 py-1.5 text-[11px] text-warning">
          Выбери разные счета
        </p>
      ) : null}
      <Button
        variant="primary"
        fullWidth
        isDisabled={!valid || pending}
        isPending={pending}
        onPress={submit}
      >
        {pending ? "Перевожу…" : "Перевести"}
      </Button>
    </div>
  );
}

function SwapForm({onClose}: {onClose: () => void}) {
  const [fromAsset, setFromAsset] = useState("USDT");
  const [toAsset, setToAsset] = useState("BTC");
  const [amount, setAmount] = useState("100");
  const [pending, setPending] = useState(false);

  const push = useToasts((s) => s.push);

  const fromPrice = ASSETS.find((a) => a.symbol === fromAsset)?.priceUsd ?? 1;
  const toPrice = ASSETS.find((a) => a.symbol === toAsset)?.priceUsd ?? 1;
  const num = parseFloat(amount) || 0;
  const out = (num * fromPrice) / toPrice;
  const valid = num > 0 && fromAsset !== toAsset;

  function submit() {
    if (!valid) return;
    setPending(true);
    window.setTimeout(() => {
      push({
        tone: "success",
        title: "Своп исполнен",
        description: `${num.toFixed(4)} ${fromAsset} → ${out.toFixed(6)} ${toAsset}`,
      });
      setPending(false);
      onClose();
    }, 600);
  }

  return (
    <div className="space-y-4">
      <Field label="Из">
        <select
          value={fromAsset}
          onChange={(e) => setFromAsset(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        >
          {ASSETS.map((a) => (
            <option key={a.symbol} value={a.symbol} className="bg-background">{a.symbol}</option>
          ))}
        </select>
      </Field>
      <Field label="Сумма">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          inputMode="decimal"
        />
      </Field>
      <div className="flex justify-center">
        <button
          onClick={() => {
            const tmp = fromAsset;
            setFromAsset(toAsset);
            setToAsset(tmp);
          }}
          className="grid size-9 place-items-center rounded-full bg-surface-secondary hover:bg-surface"
          aria-label="Поменять"
        >
          <Icon icon="gravity-ui:arrow-down" className="size-4" />
        </button>
      </div>
      <Field label="В">
        <select
          value={toAsset}
          onChange={(e) => setToAsset(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        >
          {ASSETS.map((a) => (
            <option key={a.symbol} value={a.symbol} className="bg-background">{a.symbol}</option>
          ))}
        </select>
      </Field>
      <Field label="Получишь">
        <span className="text-sm tabular-nums">≈ {out.toFixed(6)} {toAsset}</span>
      </Field>
      <div className="space-y-1 rounded-xl border border-border bg-surface p-3 text-xs">
        <Row k="Курс" v={`1 ${fromAsset} ≈ ${(fromPrice / toPrice).toFixed(6)} ${toAsset}`} />
        <Row k="Комиссия" v="0,1%" />
        <Row k="Проскальзывание" v="≤ 0,5%" />
      </div>
      {fromAsset === toAsset ? (
        <p className="rounded-lg border border-warning/30 bg-warning/5 px-2 py-1.5 text-[11px] text-warning">
          Выбери разные активы
        </p>
      ) : null}
      <Button
        variant="primary"
        fullWidth
        isDisabled={!valid || pending}
        isPending={pending}
        onPress={submit}
      >
        {pending ? "Свопаю…" : "Свопнуть"}
      </Button>
    </div>
  );
}

function Field({label, children}: {label: string; children: ReactNode}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-muted">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        {children}
      </div>
    </label>
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
