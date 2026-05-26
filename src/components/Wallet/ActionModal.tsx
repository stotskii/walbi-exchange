import {useState, type ReactNode} from "react";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {ASSETS, SUB_ACCOUNTS} from "../../lib/mock/data";

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
          {action === "deposit" ? <DepositForm /> : null}
          {action === "withdraw" ? <WithdrawForm /> : null}
          {action === "transfer" ? <TransferForm /> : null}
          {action === "swap" ? <SwapForm /> : null}
        </div>
      </div>
    </div>
  );
}

function DepositForm() {
  const [method, setMethod] = useState<"fiat" | "crypto">("crypto");
  const [asset, setAsset] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  const [credit, setCredit] = useState<typeof SUB_ACCOUNTS[number]["id"]>("funding");

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
              onChange={(e) => setCredit(e.target.value as typeof credit)}
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
            <button className="mt-2 text-xs text-accent hover:underline">
              Копировать адрес
            </button>
          </div>

          <p className="text-[10px] text-muted">
            Минимальный депозит: <b>10 USDT</b>. Зачисление после 6 подтверждений сети.
            Не отправляй другие активы — будут потеряны.
          </p>
        </>
      ) : (
        <>
          <Field label="Сумма">
            <input
              defaultValue="100"
              className="flex-1 bg-transparent text-sm outline-none"
              inputMode="decimal"
            />
            <span className="text-xs text-muted">USD</span>
          </Field>
          <p className="text-[10px] text-muted">
            Платёж через <b>Onramper</b>. Комиссия 1,5%. Зачисление мгновенно после оплаты.
          </p>
          <Button variant="primary" fullWidth>
            Перейти к оплате
          </Button>
        </>
      )}
    </div>
  );
}

function WithdrawForm() {
  return (
    <div className="space-y-4">
      <Field label="Актив">
        <span className="text-sm">USDT · Tether</span>
      </Field>
      <Field label="Сеть">
        <span className="text-sm">TRC20</span>
      </Field>
      <Field label="Адрес получателя">
        <input
          placeholder="TXxJz..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </Field>
      <Field label="Сумма">
        <input
          defaultValue="0"
          className="flex-1 bg-transparent text-sm outline-none"
          inputMode="decimal"
        />
        <button className="text-xs text-accent">Макс.</button>
      </Field>
      <div className="space-y-1 rounded-xl border border-border bg-surface p-3 text-xs">
        <Row k="Доступно" v="95 963,73 USDT" />
        <Row k="Сетевая комиссия" v="1 USDT" />
        <Row k="К получению" v="—" />
      </div>
      <Button variant="primary" fullWidth>
        Вывести
      </Button>
    </div>
  );
}

function TransferForm() {
  const [from, setFrom] = useState<typeof SUB_ACCOUNTS[number]["id"]>("funding");
  const [to, setTo] = useState<typeof SUB_ACCOUNTS[number]["id"]>("trading");
  return (
    <div className="space-y-4">
      <Field label="Откуда">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value as typeof from)}
          className="w-full bg-transparent text-sm outline-none"
        >
          {SUB_ACCOUNTS.map((s) => (
            <option key={s.id} value={s.id} className="bg-background">{s.name}</option>
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
          onChange={(e) => setTo(e.target.value as typeof to)}
          className="w-full bg-transparent text-sm outline-none"
        >
          {SUB_ACCOUNTS.map((s) => (
            <option key={s.id} value={s.id} className="bg-background">{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Сумма">
        <input
          defaultValue="0"
          className="flex-1 bg-transparent text-sm outline-none"
          inputMode="decimal"
        />
        <span className="text-xs text-muted">USDT</span>
      </Field>
      <Button variant="primary" fullWidth>
        Перевести
      </Button>
    </div>
  );
}

function SwapForm() {
  return (
    <div className="space-y-4">
      <Field label="Из">
        <select className="w-full bg-transparent text-sm outline-none">
          {ASSETS.map((a) => (
            <option key={a.symbol} value={a.symbol} className="bg-background">{a.symbol}</option>
          ))}
        </select>
      </Field>
      <Field label="Сумма">
        <input
          defaultValue="100"
          className="flex-1 bg-transparent text-sm outline-none"
          inputMode="decimal"
        />
      </Field>
      <div className="flex justify-center">
        <Icon icon="gravity-ui:arrow-down" className="size-5 text-muted" />
      </div>
      <Field label="В">
        <select className="w-full bg-transparent text-sm outline-none" defaultValue="BTC">
          {ASSETS.map((a) => (
            <option key={a.symbol} value={a.symbol} className="bg-background">{a.symbol}</option>
          ))}
        </select>
      </Field>
      <Field label="Получишь">
        <span className="text-sm tabular-nums">≈ 0,00130 BTC</span>
      </Field>
      <div className="space-y-1 rounded-xl border border-border bg-surface p-3 text-xs">
        <Row k="Курс" v="1 USDT ≈ 0,0000130 BTC" />
        <Row k="Комиссия" v="0,1%" />
        <Row k="Проскальзывание" v="≤ 0,5%" />
      </div>
      <Button variant="primary" fullWidth>
        Свопнуть
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
