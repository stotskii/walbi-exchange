import {useEffect, useRef, useState} from "react";
import {mockOrderBook, PAIRS} from "../../lib/mock/data";
import {priceFmt} from "../../lib/format";
import {subscribeOrderBook} from "../../lib/api/ws";
import type {OrderBookFrame, OrderBookLevel} from "../../lib/api/walbi-types";

interface UIBook {
  bids: Array<{price: number; amount: number}>;
  asks: Array<{price: number; amount: number}>;
}

export function OrderBook({pair, scale = 1}: {pair: string; scale?: 1 | 10 | 100 | 1000}) {
  const pairData = PAIRS.find((p) => p.symbol === pair);
  const [book, setBook] = useState<UIBook>(() => {
    const m = mockOrderBook(pair, pairData?.price ?? 0);
    return {bids: m.bids, asks: m.asks};
  });
  const [lastPrice, setLastPrice] = useState<number>(pairData?.price ?? 0);
  const fallbackRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => Promise<void>) | null = null;

    // start fallback mock loop; we'll cancel as soon as the first real frame arrives
    fallbackRef.current = window.setInterval(() => {
      setBook((prev) => ({
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

    function fromFrame(frame: OrderBookFrame): UIBook {
      const sorted = (arr: OrderBookLevel[]) =>
        arr.map((x) => ({price: x.p, amount: x.a})).filter((x) => Number.isFinite(x.price));
      return {
        bids: sorted(frame.b ?? []).sort((a, b) => b.price - a.price),
        asks: sorted(frame.a ?? []).sort((a, b) => a.price - b.price),
      };
    }

    (async () => {
      try {
        unsub = await subscribeOrderBook(pair, scale, (frame) => {
          if (cancelled) return;
          if (fallbackRef.current != null) {
            window.clearInterval(fallbackRef.current);
            fallbackRef.current = null;
          }
          const ui = fromFrame(frame);
          setBook(ui);
          // mid-price from inside spread
          const bestAsk = ui.asks[0]?.price;
          const bestBid = ui.bids[0]?.price;
          if (bestAsk && bestBid) setLastPrice((bestAsk + bestBid) / 2);
        });
      } catch (err) {
        console.warn("[OrderBook] subscribe failed, staying on mock", err);
      }
    })();

    return () => {
      cancelled = true;
      if (fallbackRef.current != null) {
        window.clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
      if (unsub) void unsub();
    };
  }, [pair, scale]);

  // reset display when pair switches
  useEffect(() => {
    const m = mockOrderBook(pair, pairData?.price ?? 0);
    setBook({bids: m.bids, asks: m.asks});
    setLastPrice(pairData?.price ?? 0);
  }, [pair, pairData?.price]);

  const allAmounts = [...book.bids.map((b) => b.amount), ...book.asks.map((a) => a.amount)];
  const maxAmount = allAmounts.length > 0 ? Math.max(...allAmounts) : 1;

  return (
    <div className="space-y-0.5 font-mono text-[11px] tabular-nums">
      {book.asks
        .slice(0, 8)
        .reverse()
        .map((level, i) => (
          <BookRow
            key={`a-${level.price}-${i}`}
            price={level.price}
            amount={level.amount}
            side="ask"
            fill={level.amount / maxAmount}
          />
        ))}

      <div className="my-1 flex items-center justify-between rounded bg-surface-secondary px-2 py-1 text-success">
        <span className="font-semibold">{priceFmt(lastPrice)}</span>
        <span className="text-[10px] text-muted">spread</span>
      </div>

      {book.bids.slice(0, 8).map((level, i) => (
        <BookRow
          key={`b-${level.price}-${i}`}
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
