import {useEffect, useRef, useState} from "react";
import {mockOrderBook, PAIRS} from "../../lib/mock/data";
import {priceFmt} from "../../lib/format";
import {subscribeOrderBook} from "../../lib/api/ws";
import type {OrderBookFrame, OrderBookLevel} from "../../lib/api/walbi-types";

// Bloomberg-style order book.  Three columns: price / size / cumulative
// (depth bar in background).  Mono everywhere, tabular figures, hairline
// rules — no decoration, the data IS the design.

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
  const [spread, setSpread] = useState<number>(0);
  const fallbackRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => Promise<void>) | null = null;

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
          const bestAsk = ui.asks[0]?.price;
          const bestBid = ui.bids[0]?.price;
          if (bestAsk && bestBid) {
            setLastPrice((bestAsk + bestBid) / 2);
            setSpread(bestAsk - bestBid);
          }
        });
      } catch (err) {
        console.warn("[OrderBook] subscribe failed", err);
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

  useEffect(() => {
    const m = mockOrderBook(pair, pairData?.price ?? 0);
    setBook({bids: m.bids, asks: m.asks});
    setLastPrice(pairData?.price ?? 0);
  }, [pair, pairData?.price]);

  // Cumulative depth — Bloomberg-style total to current row
  const asks8 = book.asks.slice(0, 8);
  const bids8 = book.bids.slice(0, 8);
  const askCum = asks8.reduce<number[]>((acc, l, i) => {
    acc[i] = (acc[i - 1] ?? 0) + l.amount;
    return acc;
  }, []);
  const bidCum = bids8.reduce<number[]>((acc, l, i) => {
    acc[i] = (acc[i - 1] ?? 0) + l.amount;
    return acc;
  }, []);
  const maxCum = Math.max(askCum[askCum.length - 1] ?? 1, bidCum[bidCum.length - 1] ?? 1);

  return (
    <div className="font-mono text-[11px] tabular-nums">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-1 px-2 pb-1 text-[9px] uppercase tracking-wider text-mute-2">
        <span>Цена</span>
        <span className="text-right">Размер</span>
        <span className="text-right">Сумма</span>
      </div>

      {/* Asks (reversed so best ask is closest to spread) */}
      <div>
        {asks8
          .slice()
          .reverse()
          .map((level, i) => {
            const idx = asks8.length - 1 - i;
            return (
              <BookRow
                key={`a-${level.price}-${i}`}
                price={level.price}
                amount={level.amount}
                cumulative={askCum[idx]}
                fillRatio={askCum[idx] / maxCum}
                side="ask"
              />
            );
          })}
      </div>

      {/* Spread divider — mono, terse */}
      <div className="my-1 grid grid-cols-[1fr_auto] items-center gap-2 border-y border-separator px-2 py-1">
        <span className="text-foreground">{priceFmt(lastPrice)}</span>
        <span className="text-[9px] text-mute-2">
          spread {spread > 0 ? priceFmt(spread) : "—"}
        </span>
      </div>

      {/* Bids */}
      <div>
        {bids8.map((level, i) => (
          <BookRow
            key={`b-${level.price}-${i}`}
            price={level.price}
            amount={level.amount}
            cumulative={bidCum[i]}
            fillRatio={bidCum[i] / maxCum}
            side="bid"
          />
        ))}
      </div>
    </div>
  );
}

function BookRow({
  price,
  amount,
  cumulative,
  fillRatio,
  side,
}: {
  price: number;
  amount: number;
  cumulative: number;
  fillRatio: number;
  side: "ask" | "bid";
}) {
  const colorClass = side === "ask" ? "text-danger" : "text-success";
  const fillClass = side === "ask" ? "bg-danger" : "bg-success";
  return (
    <div className="relative grid grid-cols-[1fr_1fr_1fr] gap-1 px-2 py-0.5">
      <div
        className={["absolute inset-y-0 right-0 opacity-[0.08]", fillClass].join(" ")}
        style={{width: `${Math.max(2, fillRatio * 100)}%`}}
        aria-hidden
      />
      <span className={["relative", colorClass].join(" ")}>{priceFmt(price)}</span>
      <span className="relative text-right text-foreground">{amount.toFixed(2)}</span>
      <span className="relative text-right text-mute-2">{cumulative.toFixed(0)}</span>
    </div>
  );
}
