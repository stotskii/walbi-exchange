import {useState} from "react";
import {usePositions} from "../../store/positions";
import {useToasts} from "../../store/toast";
import {priceFmt, usd, pct} from "../../lib/format";
import {closeDeal} from "../../lib/api/ws";
import {useLivePositions} from "../../hooks/useLivePositions";

const TABS = [
  {id: "positions", label: "Позиции"},
  {id: "orders", label: "Ордеры"},
  {id: "history", label: "История"},
] as const;

export function PositionsTable() {
  useLivePositions();

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("positions");
  const positions = usePositions((s) => s.positions);
  const closePosition = usePositions((s) => s.close);
  const pushToast = useToasts((s) => s.push);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-separator">
        <div className="flex">
          {TABS.map((t) => {
            const active = t.id === tab;
            const count = t.id === "positions" ? positions.length : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "relative flex items-baseline gap-2 px-4 py-2.5 font-mono text-[12px] transition-colors",
                  active ? "text-foreground" : "text-mute-2 hover:text-foreground",
                ].join(" ")}
              >
                <span>{t.label}</span>
                {count > 0 ? (
                  <span className="mono text-[10px] tabular-nums text-accent">{count}</span>
                ) : null}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />
                ) : null}
              </button>
            );
          })}
        </div>
        <span className="px-4 font-mono text-[11px] text-mute-2">статистика ИИ →</span>
      </div>

      {tab === "positions" ? (
        positions.length === 0 ? (
          <div className="py-10 text-center font-mono text-[11px] text-mute-2">
            Открытых позиций нет — заполни форму справа и открой Лонг/Шорт.
          </div>
        ) : (
          <table className="mono w-full text-[12px] tabular-nums">
            <thead>
              <tr className="border-b border-separator">
                <Th>Пара</Th>
                <Th>Сторона</Th>
                <Th className="text-right">Размер</Th>
                <Th className="text-right">Вход</Th>
                <Th className="text-right">Текущая</Th>
                <Th className="text-right">PnL</Th>
                <Th className="text-right">Ликвид.</Th>
                <Th className="text-right">·</Th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-b border-separator hover:bg-surface">
                  <Td>
                    {p.pair}{" "}
                    <span className="text-mute-2">×{p.leverage}</span>
                  </Td>
                  <Td>
                    <span className={p.side === "long" ? "text-success" : "text-danger"}>
                      {p.side === "long" ? "Лонг" : "Шорт"}
                    </span>
                  </Td>
                  <Td className="text-right">{usd(p.size)}</Td>
                  <Td className="text-right">{priceFmt(p.entryPrice)}</Td>
                  <Td className="text-right">{priceFmt(p.markPrice)}</Td>
                  <Td className="text-right">
                    <span className={p.pnl >= 0 ? "text-success" : "text-danger"}>
                      {p.pnl.toFixed(4)} · {pct(p.pnlPct)}
                    </span>
                  </Td>
                  <Td className="text-right text-warning">{priceFmt(p.liquidationPrice)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2 text-[11px]">
                      <button className="text-mute-2 transition-colors hover:text-foreground">
                        TP/SL
                      </button>
                      <button
                        onClick={async () => {
                          if (p.id.startsWith("walbi-")) {
                            const dealId = Number(p.id.slice("walbi-".length));
                            try {
                              await closeDeal(dealId);
                            } catch (err) {
                              pushToast({
                                title: `Не удалось закрыть ${p.pair}`,
                                description: String((err as Error)?.message ?? err),
                                tone: "danger",
                              });
                              return;
                            }
                          }
                          closePosition(p.id);
                          pushToast({
                            title: `Позиция ${p.pair} закрыта`,
                            description: `${p.side === "long" ? "Лонг" : "Шорт"} · PnL ${p.pnl.toFixed(2)} USDT`,
                            tone: p.pnl >= 0 ? "success" : "danger",
                          });
                        }}
                        className="text-danger transition-opacity hover:opacity-80"
                      >
                        Закрыть
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}

      {tab === "orders" ? (
        <div className="py-10 text-center font-mono text-[11px] text-mute-2">
          Активных ордеров нет
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="py-10 text-center font-mono text-[11px] text-mute-2">
          История пуста
        </div>
      ) : null}
    </div>
  );
}

function Th({children, className = ""}: {children: React.ReactNode; className?: string}) {
  return (
    <th
      className={["eyebrow px-4 py-2 text-left font-normal normal-case tracking-wider", className].join(" ")}
    >
      {children}
    </th>
  );
}
function Td({children, className = ""}: {children: React.ReactNode; className?: string}) {
  return <td className={["px-4 py-2.5", className].join(" ")}>{children}</td>;
}
