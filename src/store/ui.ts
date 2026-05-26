import {create} from "zustand";
import type {Agent} from "../lib/mock/types";

// UI-only state. Persisted to localStorage automatically by Zustand middleware
// would be over-engineering — values are cheap to recompute.

export type SidebarPanel =
  | null
  | "earn"
  | "earn-referral"
  | "earn-miner"
  | "earn-vouchers"
  | "earn-airdrops"
  | "earn-airdrop-detail"
  | "earn-tasks"
  | "inbox"
  | "app-stores"
  | "profile"
  | "agent-detail";

interface UIState {
  panel: SidebarPanel;
  panelHistory: SidebarPanel[];
  selectedAgent: Agent | null;
  selectedAirdropId: string | null;
  currentPair: string;
  hideBalances: boolean;
  openPanel: (p: Exclude<SidebarPanel, null>) => void;
  closePanel: () => void;
  drillPanel: (p: Exclude<SidebarPanel, null>) => void;
  backPanel: () => void;
  setSelectedAgent: (a: Agent | null) => void;
  setSelectedAirdropId: (id: string | null) => void;
  setCurrentPair: (p: string) => void;
  toggleHideBalances: () => void;
}

export const useUI = create<UIState>((set) => ({
  panel: null,
  panelHistory: [],
  selectedAgent: null,
  selectedAirdropId: null,
  currentPair: "BTCUSD",
  hideBalances: false,
  openPanel: (p) =>
    set(() => ({panel: p, panelHistory: [p]})),
  closePanel: () => set({panel: null, panelHistory: []}),
  drillPanel: (p) =>
    set((s) => ({panel: p, panelHistory: [...s.panelHistory, p]})),
  backPanel: () =>
    set((s) => {
      const next = s.panelHistory.slice(0, -1);
      return {panel: next[next.length - 1] ?? null, panelHistory: next};
    }),
  setSelectedAgent: (a) => set({selectedAgent: a}),
  setSelectedAirdropId: (id) => set({selectedAirdropId: id}),
  setCurrentPair: (p) => set({currentPair: p}),
  toggleHideBalances: () => set((s) => ({hideBalances: !s.hideBalances})),
}));
