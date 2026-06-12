import { useSyncExternalStore } from "react";
import type { PartCategory } from "./types";

export const VARIANT_LABEL: Partial<Record<PartCategory, string>> = {
  screens: "เกรดงาน",
  back_glass: "สี",
  adhesive: "ชนิดกาว",
};

const DEFAULTS: Partial<Record<PartCategory, string[]>> = {
  screens: ["แท้ (Original)", "OEM", "AAA", "Copy", "Incell"],
  back_glass: ["ดำ", "ขาว", "เงิน", "ทอง", "ฟ้า", "เขียว", "ชมพู", "ม่วง"],
  adhesive: ["B-7000", "T-7000", "กาวกันน้ำ", "เทปกันน้ำ pre-cut", "เทปสองหน้า"],
};

const KEY = "fixflow.variants";

type State = Partial<Record<PartCategory, string[]>>;

let state: State = {};
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function emit() {
  state = { ...state };
  persist();
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") state = parsed as State;
    }
  } catch { /* ignore */ }
  // fill in defaults for missing categories
  for (const cat of Object.keys(DEFAULTS) as PartCategory[]) {
    if (!state[cat]) state[cat] = [...(DEFAULTS[cat] ?? [])];
  }
}

const subscribe = (l: () => void) => {
  hydrate();
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => state;
const getServerSnapshot = () => state;

export function useVariantOptions(cat: PartCategory): string[] {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return s[cat] ?? [];
}

export function hasVariant(cat: PartCategory): boolean {
  return !!VARIANT_LABEL[cat];
}

export function addVariantOption(cat: PartCategory, v: string): void {
  hydrate();
  const t = v.trim();
  if (!t) return;
  const list = state[cat] ?? [];
  if (list.includes(t)) return;
  state[cat] = [...list, t];
  emit();
}

export function renameVariantOption(cat: PartCategory, oldV: string, newV: string): void {
  hydrate();
  const t = newV.trim();
  if (!t) return;
  const list = state[cat] ?? [];
  const idx = list.indexOf(oldV);
  if (idx === -1) return;
  const next = [...list];
  next[idx] = t;
  state[cat] = next;
  emit();
}

export function removeVariantOption(cat: PartCategory, v: string): void {
  hydrate();
  const list = state[cat] ?? [];
  const idx = list.indexOf(v);
  if (idx === -1) return;
  const next = [...list];
  next.splice(idx, 1);
  state[cat] = next;
  emit();
}
