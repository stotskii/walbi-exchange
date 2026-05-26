import {useEffect, useState} from "react";
import {mockOrderBook, PAIRS} from "../../lib/mock/data";
import {priceFmt} from "../../lib/format";

// Live-feeling order book. Updates every 1.5 s by mutating amounts slightly
// — gives the "alive" feel without wiring real WS subscriptions yet.

export function OrderBook({pair}: {pair: string}) {
  const pairData = PAIRS.find((p) => p.symbol === pair);
  const [book, setBook] = useState(() =>
    mockOrderBook(pair, pairData?.price ?? 0),
  );

  useEffect(() => {
    setBook(mockOrderBook(pair, pairData?.price ?? 0));
    const id = window.setInterval(() => {
      setBook((prev) => ({
        ...prev,
        bids: prev.bids.map((l) => ({
          ...l,
          amount: Math.max(50, +(l.amount + (Math.random() - 0.5) * 800).toFixed(2)),
        })),
        asks: prev.asks.map((l) => ({
          ...l,
          amount: Math.max(50, +(l.amount + (Math.random() - 0.5) * 800).toFixed(2)),
        })),
      }));
    }, 1500);
    return () => window.clearInterval(id);
  }, [pair, pairData?.price]);

  const maxAmount = Math.max(
    ...book.bids.map((b) => b.amount),
    ...book.asks.map((a) => a.amount),
  );

  return (
    <div className="space-y-0.5 font-mono text-[11px] tabular-nums">
      {book.asks
        .slice(0, 8)
        .reverse()
        .map((level) => (
          <BookRow
            key={`a-${level.price}`}
            price={level.price}
            amount={level.amount}
            side="ask"
            fill={level.amount / maxAmount}
          />
        ))}

      <div className="my-1 flex items-center justify-between rounded bg-surface-secondary px-2 py-1 text-success">
        <span className="font-semibold">{priceFmt(pairData?.price ?? 0)}</span>
        <span className="text-[10px] text-muted">spread</span>
      </div>

      {book.bids.slice(0, 8).map((level) => (
        <BookRow
          key={`b-${level.price}`}
          price={level.price}
          amount={level.amount}
          side="bid"
          fill={level.amount / maxAmount}
        />
      ))}
    </div>
  );
}

function BookRow({
  price,
  amount,
  side,
  fill,
}: {
  price: number;
  amount: number;
  side: "ask" | "bid";
  fill: number;
}) {
  const colorClass = side === "ask" ? "text-danger" : "text-success";
  const bgClass = side === "ask" ? "bg-danger/10" : "bg-success/10";
  return (
    <div className="relative flex justify-between rounded px-2 py-0.5">
      <div
        className={["absolute inset-y-0 right-0", bgClass].join(" ")}
        style={{width: `${Math.max(2, fill * 100)}%`}}
        aria-hidden
      />
      <span className={["relative", colorClass].join(" ")}>{priceFmt(price)}</span>
      <span className="relative text-muted">{amount.toFixed(2)}</span>
    </div>
  );
}
