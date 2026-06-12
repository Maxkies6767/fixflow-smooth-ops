import { useSyncExternalStore } from "react";
import { WARRANTIES } from "./data";
import type { Repair, Warranty, WarrantyStatus } from "./types";
import { logActivity } from "./activity-log-store";

let state: Warranty[] = WARRANTIES;
const listeners = new Set<() => void>();
const emit = () => {
  state = state.map(recompute);
  WARRANTIES.splice(0, WARRANTIES.length, ...state);
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

/** Re-derive live status from today's date — keeps "claimed" sticky. */
export function recompute(w: Warranty): Warranty {
  if (w.status === "claimed") return w;
  return { ...w, status: statusFromEnd(w.endDate) };
}

export function daysLeft(endIso: string): number {
  const ms = new Date(endIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export function useWarrantiesList(): Warranty[] {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return all.map(recompute);
}

export function useWarrantyForRepair(repairId: string): Warranty | undefined {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const w = all.find((x) => x.repairId === repairId);
  return w ? recompute(w) : undefined;
}

export function useWarrantyById(id: string): Warranty | undefined {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const w = all.find((x) => x.id === id);
  return w ? recompute(w) : undefined;
}

export function getWarrantyForRepair(repairId: string): Warranty | undefined {
  const w = state.find((x) => x.repairId === repairId);
  return w ? recompute(w) : undefined;
}

function nextWarrantyId(): string {
  let max = 1000;
  for (const w of state) {
    const m = /^W-(\d+)$/.exec(w.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `W-${max + 1}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusFromEnd(endIso: string): WarrantyStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endIso);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "expired";
  if (diffDays <= 14) return "expiring";
  return "active";
}

export interface CreateWarrantyInput {
  repair: Repair;
  days: number;
  partName: string;
  startDate?: string;
  claimNote?: string;
}

export function createWarrantyForRepair(input: CreateWarrantyInput): Warranty {
  const existing = state.find((x) => x.repairId === input.repair.id);
  if (existing) return recompute(existing);

  const start = input.startDate ?? new Date().toISOString().slice(0, 10);
  const end = addDays(start, input.days);
  const w: Warranty = {
    id: nextWarrantyId(),
    repairId: input.repair.id,
    customerId: input.repair.customerId,
    customerName: input.repair.customerName,
    phone: input.repair.phone,
    device: `${input.repair.brand} ${input.repair.model}`.trim(),
    partName: input.partName,
    startDate: start,
    endDate: end,
    days: input.days,
    status: statusFromEnd(end),
    claimNote: input.claimNote,
  };
  state = [w, ...state];
  emit();
  logActivity({
    level: "create",
    category: "warranty",
    message: `สร้างประกัน ${w.id} · ${w.device} · ${input.days} วัน (ใบงาน ${w.repairId})`,
    refId: w.id,
  });
  return w;
}

export function claimWarranty(id: string, note: string): Warranty | null {
  const idx = state.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  state[idx] = { ...state[idx], status: "claimed", claimNote: note };
  emit();
  logActivity({
    level: "update",
    category: "warranty",
    message: `เคลมประกัน ${id} — ${note || "ไม่มีหมายเหตุ"}`,
    refId: id,
  });
  return state[idx];
}
