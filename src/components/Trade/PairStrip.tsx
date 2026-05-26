import {useUI} from "../../store/ui";
import {PAIRS} from "../../lib/mock/data";
import {priceFmt, pct} from "../../lib/format";

// Horizontal scroll of available pairs — focused trading paradigm from Walbi
// (max ~8 visible at once, scrollable). Audit P1 pattern: "pairs strip как табы".

export function PairStrip() {
  const current = useUI((s) => s.currentPair);
  const setPair = useUI((s) => s.setCurrentPair);

  return (
    <div className="-mx-2 flex gap-1 overflow-x-auto px-2 pb-2 md:mx-0 md:px-0">
      {PAIRS.map((p) => {
        const active = p.symbol === current;
        const up = p.change24h >= 0;
        return (
          <button
            key={p.symbol}
            onClick={() => setPair(p.symbol)}
            className={[
              "group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors",
              active
                ? "bg-surface-secondary"
                : "bg-surface hover:bg-surface-secondary",
            ].join(" ")}
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium leading-tight">{p.base}/{p.quote}</span>
              <span className="text-[10px] leading-tight text-muted">
                {priceFmt(p.price)}
              </span>
            </div>
            <span
              className={[
                "text-[10px] font-medium leading-tight",
                up ? "text-success" : "text-danger",
              ].join(" ")}
            >
              {pct(p.change24h)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
