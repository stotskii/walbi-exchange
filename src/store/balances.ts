import {create} from "zustand";
import {persist} from "zustand/middleware";
import {SUB_ACCOUNTS} from "../lib/mock/data";
import type {SubAccount} from "../lib/mock/types";

// Per-sub-account balances, persisted to localStorage so Wallet actions
// have a place to write to and the UI shows real movement.

interface BalancesState {
  accounts: Record<SubAccount["id"], number>;
  totalUsd: () => number;
  add: (id: SubAccount["id"], delta: number) => void;
  transfer: (from: SubAccount["id"], to: SubAccount["id"], amount: number) => void;
  withdraw: (id: SubAccount["id"], amount: number) => void;
  reset: () => void;
}

const initial = Object.fromEntries(
  SUB_ACCOUNTS.map((a) => [a.id, a.balance]),
) as Record<SubAccount["id"], number>;

export const useBalances = create<BalancesState>()(
  persist(
    (set, get) => ({
      accounts: initial,
      totalUsd: () => Object.values(get().accounts).reduce((s, v) => s + v, 0),
      add: (id, delta) =>
        set((s) => ({
          accounts: {...s.accounts, [id]: Math.max(0, s.accounts[id] + delta)},
        })),
      transfer: (from, to, amount) =>
        set((s) => {
          const available = s.accounts[from];
          const moving = Math.min(available, amount);
          return {
            accounts: {
              ...s.accounts,
              [from]: available - moving,
              [to]: s.accounts[to] + moving,
            },
          };
        }),
      withdraw: (id, amount) =>
        set((s) => ({
          accounts: {...s.accounts, [id]: Math.max(0, s.accounts[id] - amount)},
        })),
      reset: () => set({accounts: initial}),
    }),
    {name: "walbi:balances"},
  ),
);
