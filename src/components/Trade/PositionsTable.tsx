import {useState} from "react";
import {Button} from "@heroui/react";
import {MOCK_POSITIONS} from "../../lib/mock/data";
import {priceFmt, usd, pct} from "../../lib/format";

const TABS = [
  {id: "positions", label: "Позиции"},
  {id: "orders", label: "Ордеры"},
  {id: "history", label: "История"},
] as const;

export function PositionsTable() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("positions");

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "px-4 py-3 text-sm transition-colors",
                  active
                    ? "border-b-2 border-accent text-foreground"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <span className="px-4 text-xs text-muted">Статистика ИИ ✨</span>
      </div>

      {tab === "positions" ? (
        MOCK_POSITIONS.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">
            Открытых позиций нет
          </div>
        ) : (
          <table className="w-full text-xs tabular-nums">
            <thead className="text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <Th>Пара</Th>
                <Th>Сторона</Th>
                <Th>Размер</Th>
                <Th>Вход</Th>
                <Th>Текущая</Th>
                <Th>PnL</Th>
                <Th>Ликвид.</Th>
                <Th>Действия</Th>
              </tr>
            </thead>
            <tbody>
              {MOCK_POSITIONS.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <Td>{p.pair} · ×{p.leverage}</Td>
                  <Td>
                    <span
                      className={
                        p.side === "long" ? "text-success" : "text-danger"
                      }
                    >
                      {p.side === "long" ? "Лонг" : "Шорт"}
                    </span>
                  </Td>
                  <Td>{usd(p.size)}</Td>
                  <Td>{priceFmt(p.entryPrice)}</Td>
                  <Td>{priceFmt(p.markPrice)}</Td>
                  <Td>
                    <span className={p.pnl >= 0 ? "text-success" : "text-danger"}>
                      {p.pnl.toFixed(4)} ({pct(p.pnlPct)})
                    </span>
                  </Td>
                  <Td>{priceFmt(p.liquidationPrice)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">TP/SL</Button>
                      <Button size="sm" variant="danger-soft">Закрыть</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}

      {tab === "orders" ? (
        <div className="py-10 text-center text-sm text-muted">
          Активных ордеров нет
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="py-10 text-center text-sm text-muted">
          История пуста
        </div>
      ) : null}
    </div>
  );
}

function Th({children}: {children: React.ReactNode}) {
  return <th className="px-4 py-2 text-left font-medium">{children}</th>;
}
function Td({children}: {children: React.ReactNode}) {
  return <td className="px-4 py-3">{children}</td>;
}
