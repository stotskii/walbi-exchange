import {useState, useMemo} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {Icon} from "@iconify/react";

import {ASSETS, SUB_ACCOUNTS} from "../lib/mock/data";
import {usd, pct} from "../lib/format";
import {DistributionDonut} from "../components/Wallet/DistributionDonut";
import {ActionModal, type WalletAction} from "../components/Wallet/ActionModal";
import {useUI} from "../store/ui";
import {useBalances} from "../store/balances";
import {useToasts} from "../store/toast";
import {usePositions} from "../store/positions";
import {useLiveBalances} from "../hooks/useLiveBalances";
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

const SUB_ASSET_FILTER: Record<string, string[] | null> = {
  overview: null,
  funding: ["USDT", "USDC", "BTC", "ETH"],
  trading: ["USDT", "USDC"],
  memepool: ["USDT"],
  "ai-agents": ["USDT"],
};

function WalletPage() {
  useLiveBalances();

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
      if (
        search &&
        !a.symbol.toLowerCase().includes(search.toLowerCase()) &&
        !a.name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [tab, showSmall, search]);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-5 py-6 md:gap-7">
      {/* Editorial header — eyebrow + display + meta line, left-aligned */}
      <header className="flex items-end justify-between border-b border-separator pb-4">
        <div>
          <div className="eyebrow mb-1.5">Счета · 26 мая 2026</div>
          <h1 className="text-[28px] font-medium leading-none tracking-tight md:text-[34px]">
            Кошелёк
          </h1>
        </div>
        <button
          onClick={() =>
            push({title: "История операций", description: "Раздел в разработке", tone: "info"})
          }
          className="flex items-center gap-1.5 rounded-sm text-[12px] text-mute-2 transition-colors hover:text-foreground"
          aria-label="История"
        >
          <Icon icon="ph:clock-counter-clockwise-bold" className="size-3.5" />
          История
        </button>
      </header>

      {/* Editorial 12-col asymmetric: balance left (8), donut right (4) */}
      {tab === "overview" ? (
        <section className="grid items-end gap-8 md:grid-cols-[1fr_220px]">
          <div className="space-y-5">
            {/* The big number — but typographic, with eyebrow + meta, no card chrome */}
            <div>
              <div className="eyebrow flex items-center gap-2">
                Общая стоимость
                <button
                  onClick={toggleHide}
                  className="text-mute-2 hover:text-foreground"
                  aria-label={hideBalances ? "Показать балансы" : "Скрыть балансы"}
                >
                  <Icon
                    icon={hideBalances ? "ph:eye-slash-bold" : "ph:eye-bold"}
                    className="size-3"
                  />
                </button>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="mono text-[44px] font-medium leading-none tracking-tight md:text-[56px]">
                  {hideBalances ? "•••• ••" : usd(totalUsd)}
                </span>
                <span className="mono text-[14px] text-mute-2">USD</span>
              </div>
              <div
                className={[
                  "mono mt-2 text-[12px]",
                  dayDelta >= 0 ? "text-success" : "text-danger",
                ].join(" ")}
              >
                {dayDelta >= 0 ? "+" : ""}
                {dayDelta.toFixed(2)} USD · {pct(dayDeltaPct)} · 24ч
              </div>
            </div>

            {/* Actions — terse text buttons, no icon-tile padding */}
            <div className="flex flex-wrap gap-1">
              <PrimaryAction onClick={() => setAction("deposit")}>Депозит</PrimaryAction>
              <SecondaryAction onClick={() => setAction("withdraw")}>Вывести</SecondaryAction>
              <SecondaryAction onClick={() => setAction("transfer")}>Перевод</SecondaryAction>
              <SecondaryAction onClick={() => setAction("swap")}>Своп</SecondaryAction>
            </div>
          </div>

          <div className="justify-self-center md:justify-self-end">
            <DistributionDonut accounts={accounts} />
          </div>
        </section>
      ) : null}

      {/* Tabs row — typographic, hairline rule active state */}
      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-separator px-1 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "relative shrink-0 px-3 py-2 text-[13px] transition-colors",
              tab === t.id ? "text-foreground" : "text-mute-2 hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
            {tab === t.id ? (
              <span className="absolute inset-x-2 -bottom-px h-px bg-accent" />
            ) : null}
          </button>
        ))}
      </div>

      {/* Sub-account rows: editorial list, not bento cards */}
      {tab === "overview" ? (
        <section>
          <div className="eyebrow mb-3">Распределение</div>
          <div className="divide-y divide-separator border-y border-separator">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setTab(acc.id)}
                className="grid w-full grid-cols-[16px_1fr_auto_auto_16px] items-baseline gap-4 px-1 py-3 text-left transition-colors hover:bg-surface md:px-2"
              >
                <span
                  className="inline-block size-2"
                  style={{backgroundColor: acc.color}}
                  aria-hidden
                />
                <span className="text-[13px]">{acc.name}</span>
                <span className="mono text-[13px] text-mute-2">
                  {(acc.shareUsd * 100).toFixed(1)}%
                </span>
                <span className="mono text-[14px] tabular-nums">
                  {hideBalances ? "••••" : usd(acc.balance)}
                </span>
                <Icon
                  icon="ph:caret-right-bold"
                  className="size-3 justify-self-end text-mute-2"
                />
              </button>
            ))}
          </div>
        </section>
      ) : activeAccount ? (
        <SubAccountView
          account={activeAccount}
          hideBalances={hideBalances}
          onAction={setAction}
          positions={tab === "ai-agents" ? positions : []}
        />
      ) : null}

      {/* Assets — bloomberg-style table, mono columns, no card chrome */}
      <section>
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-baseline">
          <div className="eyebrow">
            Активы{tab !== "overview" ? ` · ${activeAccount?.name}` : ""}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-mute-2">
            <input
              type="checkbox"
              checked={!showSmall}
              onChange={(e) => setShowSmall(!e.target.checked)}
              className="size-3 accent-accent"
            />
            Скрыть пыль
          </label>
          <label className="flex flex-1 items-center gap-2 border-b border-separator pb-1 text-[13px] md:ml-auto md:max-w-xs">
            <Icon icon="ph:magnifying-glass-bold" className="size-3.5 text-mute-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск"
              className="flex-1 bg-transparent outline-none placeholder:text-mute-2"
            />
          </label>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="border-y border-separator py-10 text-center text-[13px] text-mute-2">
            Нет активов под фильтр
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-y border-separator">
                <th className="eyebrow px-2 py-2 text-left">Крипто</th>
                <th className="eyebrow px-2 py-2 text-right">Баланс</th>
                <th className="eyebrow hidden px-2 py-2 text-right md:table-cell">Цена</th>
                <th className="eyebrow hidden px-2 py-2 text-right md:table-cell">24ч</th>
                <th className="eyebrow px-2 py-2 text-right">·</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((a) => {
                const allowed = activeAccount?.actions ?? [
                  "deposit",
                  "withdraw",
                  "transfer",
                  "swap",
                ];
                return (
                  <tr
                    key={a.symbol}
                    className="border-b border-separator transition-colors hover:bg-surface"
                  >
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid size-6 shrink-0 place-items-center rounded-sm text-[9px] font-medium text-white"
                          style={{backgroundColor: a.iconColor}}
                        >
                          {a.symbol.slice(0, 2)}
                        </span>
                        <div>
                          <div className="mono text-[13px]">{a.symbol}</div>
                          <div className="text-[10px] text-mute-2">{a.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono px-2 py-2.5 text-right tabular-nums">
                      {hideBalances ? "••••" : a.balance.toFixed(4)}
                      <div className="text-[10px] text-mute-2">
                        {hideBalances ? "••••" : usd(a.balance * a.priceUsd)} USD
                      </div>
                    </td>
                    <td className="mono hidden px-2 py-2.5 text-right tabular-nums md:table-cell">
                      {a.priceUsd.toFixed(2)}
                    </td>
                    <td
                      className={[
                        "mono hidden px-2 py-2.5 text-right tabular-nums md:table-cell",
                        a.changePct >= 0 ? "text-success" : "text-danger",
                      ].join(" ")}
                    >
                      {pct(a.changePct)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <div className="flex justify-end gap-0.5">
                        {allowed.includes("deposit") ? (
                          <RowBtn
                            icon="ph:arrow-down-bold"
                            label="Депозит"
                            onClick={() => setAction("deposit")}
                          />
                        ) : null}
                        {allowed.includes("withdraw") && a.balance > 0 ? (
                          <RowBtn
                            icon="ph:arrow-up-bold"
                            label="Вывести"
                            onClick={() => setAction("withdraw")}
                          />
                        ) : null}
                        {allowed.includes("transfer") ? (
                          <RowBtn
                            icon="ph:arrows-left-right-bold"
                            label="Перевод"
                            onClick={() => setAction("transfer")}
                          />
                        ) : null}
                        {allowed.includes("swap") ? (
                          <RowBtn
                            icon="ph:arrows-clockwise-bold"
                            label="Своп"
                            onClick={() => setAction("swap")}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

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
    <section className="space-y-4 border-y border-separator py-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span
            className="inline-block size-2 translate-y-0.5"
            style={{backgroundColor: account.color}}
            aria-hidden
          />
          <div className="eyebrow">{account.name}</div>
        </div>
        <div className="mono text-[28px] font-medium tracking-tight">
          {hideBalances ? "•••• ••" : usd(account.balance)}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {(["deposit", "withdraw", "transfer", "swap"] as const).map((a) => {
          const enabled = account.actions.includes(a);
          const label = a === "deposit" ? "Депозит" : a === "withdraw" ? "Вывести" : a === "transfer" ? "Перевод" : "Своп";
          return enabled ? (
            <SecondaryAction key={a} onClick={() => onAction(a)}>
              {label}
            </SecondaryAction>
          ) : (
            <span key={a} className="px-2.5 py-1 text-[12px] text-mute-2 line-through opacity-50">
              {label}
            </span>
          );
        })}
      </div>

      {!account.actions.includes("withdraw") ? (
        <p className="border-l-2 border-warning bg-warning-soft px-3 py-1.5 text-[11px] text-warning">
          Прямой вывод недоступен. Сначала переведи на Фандинговый.
        </p>
      ) : null}

      {account.id === "ai-agents" && positions.length > 0 ? (
        <div className="pt-2">
          <div className="eyebrow mb-2">Открытые позиции · {positions.length}</div>
          <div className="divide-y divide-separator border-y border-separator">
            {positions.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_auto_auto] items-baseline gap-4 py-2 text-[13px]"
              >
                <span className="mono">{p.pair}</span>
                <span className="mono text-mute-2">×{p.leverage}</span>
                <span className={["mono", p.side === "long" ? "text-success" : "text-danger"].join(" ")}>
                  {p.side === "long" ? "Лонг" : "Шорт"} {p.size}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PrimaryAction({onClick, children}: {onClick: () => void; children: React.ReactNode}) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm bg-foreground px-3 py-1.5 text-[13px] font-medium text-ink-12 transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  );
}

function SecondaryAction({onClick, children}: {onClick: () => void; children: React.ReactNode}) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm border border-border-strong bg-transparent px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-surface"
    >
      {children}
    </button>
  );
}

function RowBtn({icon, label, onClick}: {icon: string; label: string; onClick: () => void}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="rounded-sm p-1.5 text-mute-2 transition-colors hover:bg-surface-secondary hover:text-foreground"
      aria-label={label}
    >
      <Icon icon={icon} className="size-3.5" />
    </button>
  );
}
