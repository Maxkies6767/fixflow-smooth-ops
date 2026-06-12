import { useSyncExternalStore } from "react";
import type { Customer } from "./types";
import { logActivity } from "./activity-log-store";

const KEY = "fixflow.customers.v1";
const listeners = new Set<() => void>();

function read(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

let cache: Customer[] = read();

function write(next: Customer[]) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = read();
      listeners.forEach((l) => l());
    }
  });
}

export function listCustomers(): Customer[] {
  return cache;
}

export function getCustomer(id: string): Customer | undefined {
  return cache.find((c) => c.id === id);
}

export function addCustomer(input: { name: string; phone: string; lineId?: string; note?: string }): Customer {
  const c: Customer = {
    id: "c_" + Math.random().toString(36).slice(2, 9),
    name: input.name.trim(),
    phone: input.phone.trim(),
    lineId: input.lineId?.trim() || undefined,
    visits: 0,
    totalSpent: 0,
    lastVisit: new Date().toISOString().slice(0, 10),
    note: input.note?.trim() || undefined,
  };
  write([c, ...cache]);
  logActivity({
    level: "create",
    category: "customer",
    message: `เพิ่มลูกค้า "${c.name}" (${c.phone})`,
    refId: c.id,
  });
  return c;
}

export function deleteCustomer(id: string): boolean {
  const target = cache.find((c) => c.id === id);
  const next = cache.filter((c) => c.id !== id);
  if (next.length === cache.length) return false;
  write(next);
  logActivity({
    level: "delete",
    category: "customer",
    message: `ลบลูกค้า "${target?.name ?? id}"`,
    refId: id,
  });
  return true;
}

export function useCustomers(): Customer[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => [],
  );
}
