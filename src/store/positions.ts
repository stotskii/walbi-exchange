import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {Position} from "../lib/mock/types";
import {MOCK_POSITIONS} from "../lib/mock/data";

// Positions persisted to localStorage so opening one in /trade is visible
// next session and across tabs (event listeners would make cross-tab live,
// but persistence is enough for this UX).

interface PositionsState {
  positions: Position[];
  add: (p: Position) => void;
  close: (id: string) => void;
  reset: () => void;
}

export const usePositions = create<PositionsState>()(
  persist(
    (set) => ({
      positions: MOCK_POSITIONS,
      add: (p) => set((s) => ({positions: [p, ...s.positions]})),
      close: (id) => set((s) => ({positions: s.positions.filter((x) => x.id !== id)})),
      reset: () => set({positions: MOCK_POSITIONS}),
    }),
    {name: "walbi:positions"},
  ),
);
