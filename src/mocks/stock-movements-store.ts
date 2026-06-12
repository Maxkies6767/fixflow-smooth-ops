import { useSyncExternalStore } from "react";

export type StockMovementType = "in" | "out" | "adjust";

export interface StockMovement {
  id: string;
  partId: string;
  type: StockMovementType;
  qty: number; // delta (+/-)
  stockAfter: number;
  refRepairId?: string;
  note?: string;
  at: string; // ISO
  by: string;
}

let state: StockMovement[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  state = [...state];
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => state;

export function useStockMovements(partId?: string): StockMovement[] {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!partId) return all;
  return all.filter((m) => m.partId === partId);
}

export function addMovement(input: Omit<StockMovement, "id" | "at">): StockMovement {
  const mv: StockMovement = {
    ...input,
    id: `mv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
  };
  state.unshift(mv);
  emit();
  return mv;
}

export function getMovementsByPart(partId: string): StockMovement[] {
  return state.filter((m) => m.partId === partId);
}
