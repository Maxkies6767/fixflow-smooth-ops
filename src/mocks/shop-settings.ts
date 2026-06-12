import { useSyncExternalStore } from "react";
import { SHOP } from "./data";

export interface ShopSettings {
  name: string;
  branch: string;
  phone: string;
  taxId: string;
  address: string;
  receiptHeader: string;
  receiptFooter: string;
  laborRatePerHour: number;
}

const SEED: ShopSettings = {
  name: SHOP.name,
  branch: SHOP.branch,
  phone: SHOP.phone,
  taxId: SHOP.taxId,
  address: SHOP.address,
  receiptHeader: "ใบรับซ่อมมือถือ",
  receiptFooter: "ขอบคุณที่ใช้บริการ FIXFLOW",
  laborRatePerHour: 300,
};

const KEY = "fixflow.shopSettings";
const EVT = "fixflow:shop-changed";

let memory: ShopSettings = { ...SEED };
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ShopSettings>;
      memory = { ...SEED, ...parsed };
    }
  } catch {
    /* ignore */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  hydrate();
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): ShopSettings {
  hydrate();
  return memory;
}

function getServerSnapshot(): ShopSettings {
  return SEED;
}

export function updateShopSettings(patch: Partial<ShopSettings>) {
  memory = { ...memory, ...patch };
  persist();
}

export function resetShopSettings() {
  memory = { ...SEED };
  persist();
}

export function useShopSettings(): ShopSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
