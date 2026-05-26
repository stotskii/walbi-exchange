import {useState} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {Card} from "@heroui/react";
import {Icon} from "@iconify/react";

import {MEMECOINS} from "../lib/mock/data";
import type {MemecoinToken} from "../lib/mock/types";
import {TokenModal} from "../components/Memepool/TokenModal";
import {priceFmt, pct, usdCompact} from "../lib/format";

export const Route = createFileRoute("/memepool")({
  component: MemepoolPage,
});

type SortKey = "mcap" | "volume" | "change" | "name";

function MemepoolPage() {
  const [active, setActive] = useState<MemecoinToken | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("mcap");

  const trending = MEMECOINS.filter((t) => t.trending);
  const popular = MEMECOINS
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name);
        case "change": return b.changePct - a.changePct;
        case "volume": return b.volume24hUsd - a.volume24hUsd;
        default: return b.marketCapUsd - a.marketCapUsd;
      }
    });

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Мемепул</h1>
        <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-1.5 text-xs">
          <span className="text-muted">Портфолио</span>
          <span className="font-medium">$0,00</span>
          <span className="text-success">+0%</span>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider text-muted">🔥 В тренде</h2>
          <button
            onClick={() => {
              document.getElementById("memepool-popular")?.scrollIntoView({behavior: "smooth", block: "start"});
            }}
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Все ↓
          </button>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {trending.map((t) => (
            <TrendCard key={t.symbol} token={t} onClick={() => setActive(t)} />
          ))}
        </div>
      </section>

      <Card className="rounded-2xl" id="memepool-popular">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <h2 className="text-sm font-medium">Популярные</h2>

          <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm md:max-w-md">
            <Icon icon="gravity-ui:magnifier" className="size-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или символу"
              className="flex-1 bg-transparent outline-none placeholder:text-muted"
            />
          </label>

          <div className="flex items-center gap-1">
            {([
              ["mcap", "MC"],
              ["volume", "Vol"],
              ["change", "24ч"],
              ["name", "А-Я"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={[
                  "rounded-lg px-2.5 py-1 text-xs transition-colors",
                  sort === k ? "bg-surface-secondary" : "text-muted hover:bg-surface-secondary",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2 text-left">Имя</th>
              <th className="px-4 py-2 text-right">Mkt Cap</th>
              <th className="hidden px-4 py-2 text-right md:table-cell">Объём 24ч</th>
              <th className="px-4 py-2 text-right">Цена</th>
              <th className="px-4 py-2 text-right">24ч</th>
            </tr>
          </thead>
          <tbody>
            {popular.map((t) => (
              <tr
                key={t.symbol}
                onClick={() => setActive(t)}
                className="cursor-pointer border-t border-border transition-colors hover:bg-surface-secondary"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                      style={{backgroundColor: t.iconColor}}
                    >
                      {t.symbol.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate font-medium">
                        {t.name}
                        {t.verified ? (
                          <Icon icon="gravity-ui:check-shape" className="size-3.5 text-success" />
                        ) : null}
                      </div>
                      <div className="text-[10px] text-muted">{t.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-muted">{usdCompact(t.marketCapUsd)}</td>
                <td className="hidden px-4 py-2.5 text-right text-muted md:table-cell">{usdCompact(t.volume24hUsd)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">${priceFmt(t.priceUsd)}</td>
                <td className={["px-4 py-2.5 text-right tabular-nums", t.changePct >= 0 ? "text-success" : "text-danger"].join(" ")}>
                  {pct(t.changePct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {active ? <TokenModal token={active} onClose={() => setActive(null)} /> : null}
    </div>
  );
}

function TrendCard({token, onClick}: {token: MemecoinToken; onClick: () => void}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-44 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-secondary"
    >
      <div className="flex items-center gap-2">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
          style={{backgroundColor: token.iconColor}}
        >
          {token.symbol.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-xs font-medium">
            {token.name}
            {token.verified ? (
              <Icon icon="gravity-ui:check-shape" className="size-3 text-success" />
            ) : null}
          </div>
          <div className="text-[10px] text-muted">{token.symbol}</div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-sm tabular-nums">${priceFmt(token.priceUsd)}</span>
        <span
          className={[
            "text-xs font-medium",
            token.changePct >= 0 ? "text-success" : "text-danger",
          ].join(" ")}
        >
          {pct(token.changePct)}
        </span>
      </div>
    </button>
  );
}
