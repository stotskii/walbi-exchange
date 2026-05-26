import {useEffect} from "react";
import {useBalances, type BalanceEntry} from "../store/balances";
import {walbiSocket, subscribeBalanceChanges} from "../lib/api/ws";

// Pulls balance accounts via WS request `balance_account:list` (event 153)
// once, then subscribes to live `balance:change:v3` push and updates the
// local store. Components don't need to know any of this — they just keep
// reading from useBalances().

interface BalanceAccountListItem {
  account_id?: number;
  amount?: string | number;
  amount_free?: string | number;
  group?: string;
  currency?: string;
}

interface BalanceAccountListResponse {
  list?: BalanceAccountListItem[];
  accounts?: BalanceAccountListItem[];
}

function toNum(v: string | number | undefined): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

function normalize(item: BalanceAccountListItem): BalanceEntry | null {
  if (item.account_id == null || !item.group) return null;
  return {
    account_id: item.account_id,
    group: item.group,
    amount: toNum(item.amount),
    amount_free: toNum(item.amount_free),
    currency: item.currency,
  };
}

export function useLiveBalances(): void {
  const bulk = useBalances((s) => s.bulk);
  const upsert = useBalances((s) => s.upsert);

  useEffect(() => {
    let cancelled = false;

    // snapshot
    (async () => {
      try {
        const res = await walbiSocket.request<unknown, BalanceAccountListResponse>(
          "balance_account:list",
        );
        if (cancelled) return;
        const list = res?.list ?? res?.accounts ?? [];
        const entries = list.map(normalize).filter((x): x is BalanceEntry => x !== null);
        if (entries.length > 0) bulk(entries);
      } catch (err) {
        console.warn("[balances] snapshot failed", err);
      }
    })();

    // live updates
    const off = subscribeBalanceChanges((b) => {
      if (!b?.group || b.account_id == null) return;
      upsert({
        account_id: b.account_id,
        group: b.group,
        amount: toNum(b.amount),
        amount_free: toNum(b.amount_free),
      });
    });

    return () => {
      cancelled = true;
      off();
    };
  }, [bulk, upsert]);
}
