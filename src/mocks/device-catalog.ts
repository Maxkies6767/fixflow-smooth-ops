import { useSyncExternalStore } from "react";

export type Catalog = Record<string, string[]>;

const SEED: Catalog = {
  Apple: [
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone SE (2022)", "iPhone XR", "iPhone XS Max",
    "iPad Air 5", "iPad Pro 12.9", "iPad mini 6",
  ],
  Samsung: [
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24",
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23",
    "Galaxy S22 Ultra", "Galaxy S22",
    "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy Z Fold 4",
    "Galaxy Note 20 Ultra", "Galaxy Note 20",
    "Galaxy A55", "Galaxy A54", "Galaxy A35", "Galaxy A25",
  ],
  Xiaomi: [
    "14 Pro", "14", "13 Pro", "13", "13T Pro",
    "Redmi Note 13 Pro", "Redmi Note 13", "Redmi Note 12 Pro",
    "POCO X6 Pro", "POCO F5",
  ],
  OPPO: [
    "Reno 11 Pro", "Reno 11", "Reno 10 Pro", "Reno 10",
    "Find X7", "Find X6 Pro",
    "A98", "A78", "A58",
  ],
  Vivo: [
    "V30 Pro", "V30", "V29 Pro", "V29",
    "Y36", "Y27", "X100 Pro",
  ],
  Huawei: ["P60 Pro", "Mate 60 Pro", "Nova 11", "Nova 12"],
  realme: ["12 Pro+", "12 Pro", "11 Pro+", "C67", "GT Neo 5"],
};

const KEY = "fixflow.deviceCatalog";
const EVT = "fixflow:catalog-changed";

let memory: Catalog = clone(SEED);
let hydrated = false;

function clone(c: Catalog): Catalog {
  const out: Catalog = {};
  for (const k of Object.keys(c)) out[k] = [...c[k]];
  return out;
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Catalog;
      if (parsed && typeof parsed === "object") memory = parsed;
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

function getSnapshot(): Catalog {
  hydrate();
  return memory;
}

function getServerSnapshot(): Catalog {
  return SEED;
}

function normalize(s: string) {
  return s.trim();
}

function findKey(name: string): string | null {
  const n = name.trim().toLowerCase();
  return Object.keys(memory).find((k) => k.toLowerCase() === n) ?? null;
}

export function addBrand(name: string): string | null {
  const n = normalize(name);
  if (!n) return null;
  const existing = findKey(n);
  if (existing) return existing;
  memory = { ...memory, [n]: [] };
  persist();
  return n;
}

export function removeBrand(name: string): boolean {
  if (Object.keys(memory).length <= 1) return false;
  const k = findKey(name);
  if (!k) return false;
  const next = { ...memory };
  delete next[k];
  memory = next;
  persist();
  return true;
}

export function addModel(brand: string, model: string): boolean {
  const k = findKey(brand) ?? addBrand(brand);
  if (!k) return false;
  const m = normalize(model);
  if (!m) return false;
  const list = memory[k];
  if (list.some((x) => x.toLowerCase() === m.toLowerCase())) return false;
  memory = { ...memory, [k]: [...list, m] };
  persist();
  return true;
}

export function removeModel(brand: string, model: string): boolean {
  const k = findKey(brand);
  if (!k) return false;
  const before = memory[k];
  const after = before.filter((x) => x.toLowerCase() !== model.toLowerCase());
  if (after.length === before.length) return false;
  memory = { ...memory, [k]: after };
  persist();
  return true;
}

export function resetCatalog() {
  memory = clone(SEED);
  persist();
}

export function useDeviceCatalog(): Catalog {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
