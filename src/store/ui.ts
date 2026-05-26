import {create} from "zustand";
import {persist, createJSONStorage} from "zustand/middleware";
import type {Agent} from "../lib/mock/types";

// UI-only state. Persisted to localStorage so things like current pair,
// hide-balances toggle, and favorite pairs survive page reload.

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
  favorites: string[];
  runningAgents: string[];
  openPanel: (p: Exclude<SidebarPanel, null>) => void;
  closePanel: () => void;
  drillPanel: (p: Exclude<SidebarPanel, null>) => void;
  backPanel: () => void;
  setSelectedAgent: (a: Agent | null) => void;
  setSelectedAirdropId: (id: string | null) => void;
  setCurrentPair: (p: string) => void;
  toggleHideBalances: () => void;
  toggleFavorite: (pair: string) => void;
  isFavorite: (pair: string) => boolean;
  toggleRunningAgent: (id: string) => void;
  isAgentRunning: (id: string) => boolean;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      panel: null,
      panelHistory: [],
      selectedAgent: null,
      selectedAirdropId: null,
      currentPair: "BTCUSD",
      hideBalances: false,
      favorites: [],
      runningAgents: [],
      openPanel: (p) => set(() => ({panel: p, panelHistory: [p]})),
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
      toggleFavorite: (pair) =>
        set((s) => ({
          favorites: s.favorites.includes(pair)
            ? s.favorites.filter((p) => p !== pair)
            : [...s.favorites, pair],
        })),
      isFavorite: (pair) => get().favorites.includes(pair),
      toggleRunningAgent: (id) =>
        set((s) => ({
          runningAgents: s.runningAgents.includes(id)
            ? s.runningAgents.filter((x) => x !== id)
            : [...s.runningAgents, id],
        })),
      isAgentRunning: (id) => get().runningAgents.includes(id),
    }),
    {
      name: "walbi:ui",
      storage: createJSONStorage(() => localStorage),
      // never persist transient state like open panels or selected items
      partialize: (s) => ({
        currentPair: s.currentPair,
        hideBalances: s.hideBalances,
        favorites: s.favorites,
        runningAgents: s.runningAgents,
      }),
    },
  ),
);
