import {create} from "zustand";

export type ToastTone = "success" | "danger" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  /** auto-dismiss after this many ms; 0 = manual close only */
  ttl?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: Toast = {id, ttl: 4000, ...t};
    set((s) => ({toasts: [...s.toasts, toast]}));
    if (toast.ttl && toast.ttl > 0) {
      window.setTimeout(() => get().dismiss(id), toast.ttl);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({toasts: s.toasts.filter((t) => t.id !== id)})),
}));
