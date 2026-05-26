import {useState, useMemo} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {Card, Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {ASSETS, SUB_ACCOUNTS} from "../lib/mock/data";
import {usd, pct} from "../lib/format";
import {DistributionDonut} from "../components/Wallet/DistributionDonut";
import {ActionModal, type WalletAction} from "../components/Wallet/ActionModal";
import {useUI} from "../store/ui";
import {useBalances} from "../store/balances";
import {useToasts} from "../store/toast";
import {usePositions} from "../store/positions";
import type {SubAccount} from "../lib/mock/types";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

const TABS = [
  {id: "overview" as const, label: "Обзор"},
  {id: "funding" as const, label: "Фандинговый"},
  {id: "trading" as const, label: "Торговый"},
  {id: "memepool" as const, label: "Мемепул"},
  {id: "ai-agents" as const, label: "ИИ-агенты"},
];

// Which assets each sub-account holds (UI-only mapping; real implementation
// would come from API).
const SUB_ASSET_FILTER: Record<string, string[] | null> = {
  overview: null, // all
  funding: ["USDT", "USDC", "BTC", "ETH"],
  trading: ["USDT", "USDC"],
  memepool: ["USDT"],
  "ai-agents": ["USDT"],
};

function WalletPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [showSmall, setShowSmall] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<WalletAction | null>(null);
  const hideBalances = useUI((s) => s.hideBalances);
  const toggleHide = useUI((s) => s.toggleHideBalances);
  const balances = useBalances((s) => s.accounts);
  const push = useToasts((s) => s.push);
  const positions = usePositions((s) => s.positions);

  const totalUsd = Object.values(balances).reduce((s, v) => s + v, 0);
  const dayDelta = -87.03;
  const dayDeltaPct = -0.0009;

  // Sub-accounts with live balances from the store
  const accounts: SubAccount[] = SUB_ACCOUNTS.map((a) => ({
    ...a,
    balance: balances[a.id],
    shareUsd: totalUsd > 0 ? balances[a.id] / totalUsd : 0,
  }));

  const activeAccount = accounts.find((a) => a.id === tab);

  const filteredAssets = useMemo(() => {
    const filter = SUB_ASSET_FILTER[tab];
    return ASSETS.filter((a) => {
      if (filter && !filter.includes(a.symbol)) return false;
      if (!showSmall && a.balance * a.priceUsd < 1) return false;
      if (search && !a.symbol.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, showSmall, search]);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Кошелек</h1>
        <button
          onClick={() => push({title: "История операций", description: "Раздел в разработке", tone: "info"})}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-secondary"
          aria-label="История"
          title="История"
        >
          <Icon icon="gravity-ui:clock" className="size-5" />
        </button>
      </header>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "shrink-0 rounded-xl px-4 py-1.5 text-sm transition-colors",
              tab === t.id ? "bg-surface-secondary" : "text-muted hover:bg-surface",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <Card className="rounded-2xl">
            <Card.Content className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  Предполагаемая общая стоимость
                  <button
                    onClick={toggleHide}
                    className="rounded p-0.5 text-muted hover:text-foreground"
                    aria-label={hideBalances ? "Показать балансы" : "Скрыть балансы"}
                  >
                    <Icon
                      icon={hideBalances ? "gravity-ui:eye-slash" : "gravity-ui:eye"}
                      className="size-3.5"
                    />
                  </button>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">
                    {hideBalances ? "•••• ••" : usd(totalUsd)}
                  </span>
                  <select className="bg-transparent text-sm text-muted outline-none">
                    <option>USD</option>
                    <option>USDT</option>
                    <option>EUR</option>
                  </select>
                </div>
                <div className={["text-xs tabular-nums", dayDelta >= 0 ? "text-success" : "text-danger"].join(" ")}>
                  {dayDelta >= 0 ? "+" : ""}{dayDelta.toFixed(2)} USD ({pct(dayDeltaPct)})
                </div>

                <div className="mt-4 grid max-w-md grid-cols-4 gap-2">
                  <ActionBtn icon="gravity-ui:arrow-down-to-line" label="Депозит" onClick={() => setAction("deposit")} />
                  <ActionBtn icon="gravity-ui:arrow-up-from-line" label="Вывести" onClick={() => setAction("withdraw")} />
                  <ActionBtn icon="gravity-ui:arrows-rotate-left" label="Перевод" onClick={() => setAction("transfer")} />
                  <ActionBtn icon="gravity-ui:circles-3-plus" label="Своп" onClick={() => setAction("swap")} />
                </div>
              </div>

              <div className="hidden md:block">
                <DistributionDonut accounts={accounts} />
              </div>
            </Card.Content>
          </Card>

          <section>
            <h2 className="mb-3 px-1 text-xs uppercase tracking-wider text-muted">
              Распределение
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setTab(acc.id)}
                  className="text-left"
                >
                  <Card className="rounded-2xl transition-colors hover:bg-surface-secondary">
                    <Card.Content className="p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="inline-block size-2.5 rounded-full" style={{backgroundColor: acc.color}} />
                          {acc.name}
                        </span>
                        <Icon icon="gravity-ui:chevron-right" className="size-3.5 text-muted" />
                      </div>
                      <div className="mt-2 text-lg font-semibold tabular-nums">
                        {hideBalances ? "••••" : `${usd(acc.balance)} $`}
                      </div>
                      <div className="text-xs text-muted">{(acc.shareUsd * 100).toFixed(2)} %</div>
                    </Card.Content>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : activeAccount ? (
        <SubAccountView
          account={activeAccount}
          hideBalances={hideBalances}
          onAction={setAction}
          positions={tab === "ai-agents" ? positions : []}
        />
      ) : null}

      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <h2 className="font-medium">
            Активы {tab !== "overview" ? `· ${activeAccount?.name}` : ""}
          </h2>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!showSmall}
              onChange={(e) => setShowSmall(!e.target.checked)}
              className="size-3.5 accent-accent"
            />
            Скрыть небольшие балансы
          </label>
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm md:ml-auto md:max-w-xs">
            <Icon icon="gravity-ui:magnifier" className="size-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск"
              className="flex-1 bg-transparent outline-none placeholder:text-muted"
            />
          </label>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">
            Нет активов под фильтр
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Крипто</th>
                <th className="px-4 py-2 text-right">Баланс</th>
                <th className="hidden px-4 py-2 text-right md:table-cell">Цена</th>
                <th className="px-4 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((a) => {
                const allowed = activeAccount?.actions ?? ["deposit", "withdraw", "transfer", "swap"];
                return (
                  <tr key={a.symbol} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white"
                          style={{backgroundColor: a.iconColor}}
                        >
                          {a.symbol.slice(0, 2)}
                        </span>
                        <div>
                          <div className="font-medium">{a.symbol}</div>
                          <div className="text-[10px] text-muted">{a.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {hideBalances ? "••••" : a.balance.toFixed(4)} {a.symbol}
                      <div className="text-[10px] text-muted">
                        ≈ {hideBalances ? "••••" : usd(a.balance * a.priceUsd)} USD
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">
                      ${a.priceUsd.toFixed(2)}
                      <div className={["text-[10px]", a.changePct >= 0 ? "text-success" : "text-danger"].join(" ")}>
                        {pct(a.changePct)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {allowed.includes("deposit") ? <RowBtn icon="gravity-ui:arrow-down-to-line" label="Депозит" onClick={() => setAction("deposit")} /> : null}
                        {allowed.includes("withdraw") && a.balance > 0 ? <RowBtn icon="gravity-ui:arrow-up-from-line" label="Вывести" onClick={() => setAction("withdraw")} /> : null}
                        {allowed.includes("transfer") ? <RowBtn icon="gravity-ui:arrows-rotate-left" label="Перевод" onClick={() => setAction("transfer")} /> : null}
                        {allowed.includes("swap") ? <RowBtn icon="gravity-ui:circles-3-plus" label="Своп" onClick={() => setAction("swap")} /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {action ? <ActionModal action={action} onClose={() => setAction(null)} /> : null}
    </div>
  );
}

function SubAccountView({
  account,
  hideBalances,
  onAction,
  positions,
}: {
  account: SubAccount;
  hideBalances: boolean;
  onAction: (a: WalletAction) => void;
  positions: ReturnType<typeof usePositions.getState>["positions"];
}) {
  return (
    <Card className="rounded-2xl">
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-block size-3 rounded-full" style={{backgroundColor: account.color}} />
          <div>
            <div className="text-xs text-muted">Баланс счёта</div>
            <div className="text-2xl font-semibold tabular-nums">
              {hideBalances ? "•••• ••" : `${usd(account.balance)} $`}
            </div>
          </div>
        </div>

        <div className="grid max-w-md grid-cols-4 gap-2">
          {(["deposit", "withdraw", "transfer", "swap"] as const).map((a) => (
            <ActionBtn
              key={a}
              icon={
                a === "deposit"
                  ? "gravity-ui:arrow-down-to-line"
                  : a === "withdraw"
                    ? "gravity-ui:arrow-up-from-line"
                    : a === "transfer"
                      ? "gravity-ui:arrows-rotate-left"
                      : "gravity-ui:circles-3-plus"
              }
              label={a === "deposit" ? "Депозит" : a === "withdraw" ? "Вывести" : a === "transfer" ? "Перевод" : "Своп"}
              disabled={!account.actions.includes(a)}
              onClick={() => onAction(a)}
            />
          ))}
        </div>

        {!account.actions.includes("withdraw") ? (
          <p className="rounded-lg border border-warning/30 bg-warning/5 px-2 py-1.5 text-[11px] text-warning">
            Прямой вывод с этого счёта недоступен. Сначала переведи на Фандинговый.
          </p>
        ) : null}

        {account.id === "ai-agents" && positions.length > 0 ? (
          <div className="pt-2">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted">
              Открытые позиции
            </div>
            <div className="space-y-1.5 text-xs">
              {positions.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <span>{p.pair} · ×{p.leverage}</span>
                  <span className={p.side === "long" ? "text-success" : "text-danger"}>
                    {p.side === "long" ? "Лонг" : "Шорт"} {p.size}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      onPress={onClick}
      isDisabled={disabled}
      className="flex h-auto flex-col items-center gap-1 py-3"
      size="sm"
    >
      <Icon icon={icon} className="size-5" />
      <span className="text-[11px]">{label}</span>
    </Button>
  );
}

function RowBtn({icon, label, onClick}: {icon: string; label: string; onClick: () => void}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
      aria-label={label}
    >
      <Icon icon={icon} className="size-4" />
    </button>
  );
}
