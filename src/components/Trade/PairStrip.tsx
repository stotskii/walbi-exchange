import {useUI} from "../../store/ui";
import {PAIRS} from "../../lib/mock/data";
import {priceFmt, pct} from "../../lib/format";

// Pair strip — terminal-row of tickers, mono, hairline-separated, no pills.
// Active state = underline. Bloomberg-esque.

export function PairStrip() {
  const current = useUI((s) => s.currentPair);
  const setPair = useUI((s) => s.setCurrentPair);

  return (
    <div className="no-scrollbar -mx-3 flex overflow-x-auto border-y border-separator">
      {PAIRS.map((p) => {
        const active = p.symbol === current;
        const up = p.change24h >= 0;
        return (
          <button
            key={p.symbol}
            onClick={() => setPair(p.symbol)}
            className={[
              "relative flex shrink-0 items-baseline gap-2 border-r border-separator px-3 py-2 text-left font-mono text-[11px] tabular-nums transition-colors",
              active ? "bg-surface" : "hover:bg-surface",
            ].join(" ")}
          >
            <span className={active ? "text-foreground" : "text-mute-2"}>
              {p.base}/{p.quote}
            </span>
            <span className={up ? "text-success" : "text-danger"}>
              {priceFmt(p.price)}
            </span>
            <span
              className={[
                "text-[10px]",
                up ? "text-success" : "text-danger",
              ].join(" ")}
            >
              {pct(p.change24h)}
            </span>
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-px bg-accent" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
