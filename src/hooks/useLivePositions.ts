import {useEffect} from "react";
import {subscribeDealEvents} from "../lib/api/ws";
import {usePositions} from "../store/positions";
import type {APIDeal} from "../lib/api/walbi-types";
import type {Position} from "../lib/mock/types";

// Translate Walbi APIDeal → UI Position
function toUi(d: APIDeal): Position {
  const lev = d.multiplicator ?? 1;
  const dir = (d.dir || "").toLowerCase() === "short" ? "short" : "long";
  return {
    id: `walbi-${d.id}`,
    pair: d.pair,
    side: dir,
    size: parseFloat(d.amount) || 0,
    entryPrice: d.price_open,
    markPrice: d.price_current ?? d.price_open,
    leverage: lev,
    pnl: parseFloat(d.floating_pnl) || 0,
    pnlPct:
      (parseFloat(d.floating_pnl) || 0) /
      Math.max(1, (parseFloat(d.amount) || 0)),
    liquidationPrice: d.stop_out_price ?? 0,
  };
}

export function useLivePositions(): void {
  const add = usePositions((s) => s.add);
  const close = usePositions((s) => s.close);

  useEffect(() => {
    const off = subscribeDealEvents((deal, eventName) => {
      if (!deal || !deal.id) return;
      if (eventName.endsWith(":closed")) {
        close(`walbi-${deal.id}`);
      } else {
        // open / change / proceed — upsert
        const pos = toUi(deal);
        // remove first to avoid dup on add
        close(pos.id);
        add(pos);
      }
    });
    return off;
  }, [add, close]);
}
