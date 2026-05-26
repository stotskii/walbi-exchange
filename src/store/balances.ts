import {create} from "zustand";

// Live trading-balance state, sourced from the WS push `balance:change:v3`
// (or sub-account REST snapshot on initial mount). Keyed by group string,
// which Walbi uses to label sub-accounts (funding / trading / memepool /
// ai-agents / partner / ...).

export interface BalanceEntry {
  account_id: number;
  group: string;
  amount: number; // total
  amount_free: number; // available after locks
  currency?: string;
}

interface BalancesState {
  byGroup: Record<string, BalanceEntry>;
  total: () => number;
  upsert: (entry: BalanceEntry) => void;
  bulk: (entries: BalanceEntry[]) => void;
  reset: () => void;

  // legacy adapter: components that used the old store can keep calling
  // `accounts[id]` for the 4 canonical sub-accounts (funding/trading/...)
  accounts: Record<string, number>;
  /** Move funds locally — used by Transfer modal as optimistic update. */
  transfer: (from: string, to: string, amount: number) => void;
  add: (group: string, delta: number) => void;
  withdraw: (group: string, amount: number) => void;
}

export const useBalances = create<BalancesState>((set, get) => ({
  byGroup: {},
  accounts: {},

  total: () =>
    Object.values(get().byGroup).reduce((s, e) => s + e.amount, 0),

  upsert: (entry) =>
    set((s) => ({
      byGroup: {...s.byGroup, [entry.group]: entry},
      accounts: {...s.accounts, [entry.group]: entry.amount},
    })),

  bulk: (entries) =>
    set(() => {
      const byGroup: Record<string, BalanceEntry> = {};
      const accounts: Record<string, number> = {};
      for (const e of entries) {
        byGroup[e.group] = e;
        accounts[e.group] = e.amount;
      }
      return {byGroup, accounts};
    }),

  reset: () => set({byGroup: {}, accounts: {}}),

  transfer: (from, to, amount) =>
    set((s) => {
      const a = (s.byGroup[from]?.amount ?? 0) - amount;
      const b = (s.byGroup[to]?.amount ?? 0) + amount;
      const next = {
        ...s.byGroup,
        ...(s.byGroup[from] ? {[from]: {...s.byGroup[from], amount: Math.max(0, a)}} : {}),
        ...(s.byGroup[to] ? {[to]: {...s.byGroup[to], amount: b}} : {}),
      };
      const accounts: Record<string, number> = {};
      for (const [k, v] of Object.entries(next)) accounts[k] = v.amount;
      return {byGroup: next, accounts};
    }),

  add: (group, delta) =>
    set((s) => {
      const cur = s.byGroup[group];
      if (!cur) return {};
      const next = {...cur, amount: Math.max(0, cur.amount + delta)};
      return {
        byGroup: {...s.byGroup, [group]: next},
        accounts: {...s.accounts, [group]: next.amount},
      };
    }),

  withdraw: (group, amount) =>
    set((s) => {
      const cur = s.byGroup[group];
      if (!cur) return {};
      const next = {...cur, amount: Math.max(0, cur.amount - amount)};
      return {
        byGroup: {...s.byGroup, [group]: next},
        accounts: {...s.accounts, [group]: next.amount},
      };
    }),
}));
