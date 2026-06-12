import { useSyncExternalStore } from "react";
import { PARTS } from "./data";
import type { Part, PartCategory } from "./types";
import { addMovement, type StockMovementType } from "./stock-movements-store";
import { logActivity } from "./activity-log-store";

// Migrate seed: ensure model is set
let state: Part[] = PARTS.map((p) => ({
  ...p,
  model: p.model && p.model.trim() ? p.model : (p.compatible[0] ?? ""),
}));

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

export function usePartsList(): Part[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getAllParts(): Part[] {
  return state;
}

export function isSkuTaken(sku: string, excludeId?: string): boolean {
  const s = sku.trim().toLowerCase();
  if (!s) return false;
  return state.some((p) => p.sku.toLowerCase() === s && p.id !== excludeId);
}

export function addPart(input: Omit<Part, "id">): Part {
  const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const part: Part = { ...input, id };
  state.push(part);
  emit();
  logActivity({
    level: "create",
    category: "part",
    message: `เพิ่มอะไหล่ "${part.name}" (${part.sku}) เริ่มสต็อก ${part.stock}`,
    refId: part.id,
  });
  return part;
}

export function updatePart(id: string, patch: Partial<Omit<Part, "id">>): void {
  const idx = state.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const before = state[idx];
  state[idx] = { ...before, ...patch };
  emit();
  logActivity({
    level: "update",
    category: "part",
    message: `แก้ไขอะไหล่ "${state[idx].name}" (${state[idx].sku})`,
    refId: id,
  });
}

export function deletePart(id: string): void {
  const idx = state.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const part = state[idx];
  state.splice(idx, 1);
  emit();
  logActivity({
    level: "delete",
    category: "part",
    message: `ลบอะไหล่ "${part.name}" (${part.sku})`,
    refId: id,
  });
}

export function getPartBySku(sku: string): Part | undefined {
  const s = sku.trim().toLowerCase();
  if (!s) return undefined;
  return state.find((p) => p.sku.toLowerCase() === s);
}

/**
 * Adjust stock + log a movement. Returns the new stock.
 * type:'in' qty positive, 'out' qty negative, 'adjust' qty signed delta.
 */
export function adjustStock(
  partId: string,
  delta: number,
  opts: { type: StockMovementType; note?: string; refRepairId?: string; by?: string } = { type: "adjust" },
): number | null {
  const idx = state.findIndex((p) => p.id === partId);
  if (idx === -1) return null;
  const next = Math.max(0, state[idx].stock + delta);
  const before = state[idx];
  state[idx] = { ...state[idx], stock: next };
  addMovement({
    partId,
    type: opts.type,
    qty: delta,
    stockAfter: next,
    note: opts.note,
    refRepairId: opts.refRepairId,
    by: opts.by ?? "ฉัน",
  });
  emit();
  const verb = opts.type === "in" ? "เติม" : opts.type === "out" ? "เบิก" : "ปรับ";
  const lvl = opts.type === "in" ? "return" : opts.type === "out" ? "issue" : "update";
  logActivity({
    level: lvl,
    category: "stock",
    message: `${verb}สต็อก "${before.name}" ${delta > 0 ? "+" : ""}${delta} (คงเหลือ ${next})${opts.note ? ` — ${opts.note}` : ""}`,
    refId: partId,
    actor: opts.by,
  });
  return next;
}

// ---------- SKU generation ----------

export const CATEGORY_PREFIX: Record<PartCategory, string> = {
  screens: "SCR",
  batteries: "BAT",
  ports: "PORT",
  ics: "IC",
  cameras: "CAM",
  charging_flex: "FLEX",
  back_glass: "BACK",
  switches: "SW",
  adhesive: "GLUE",
};

const MODEL_SHORTHAND: Array<[RegExp, string]> = [
  [/iphone\s*/i, "IP"],
  [/galaxy\s*/i, "GX"],
  [/redmi note\s*/i, "RMN"],
  [/redmi\s*/i, "RM"],
  [/poco\s*/i, "POCO"],
  [/ipad\s*/i, "IPAD"],
];

function slugifyModel(input: string): string {
  let s = input.trim();
  if (!s) return "GEN";
  for (const [re, rep] of MODEL_SHORTHAND) s = s.replace(re, rep);
  s = s
    .toUpperCase()
    .replace(/PRO MAX/g, "PM")
    .replace(/\bPRO\b/g, "P")
    .replace(/\bPLUS\b/g, "PL")
    .replace(/\bULTRA\b/g, "U")
    .replace(/\bMINI\b/g, "M")
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  return s || "GEN";
}

function slugifyVariant(v: string): string {
  return v
    .toUpperCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^A-Z0-9ก-๙]+/g, "")
    .slice(0, 6);
}

export function generateSku(
  category: PartCategory,
  model: string,
  fallbackName: string,
  excludeId?: string,
  variant?: string,
): string {
  const prefix = CATEGORY_PREFIX[category] ?? "PART";
  const base = (model && model.trim()) || fallbackName;
  const slug = slugifyModel(base);
  const vSlug = variant && variant.trim() ? slugifyVariant(variant) : "";
  const head = vSlug ? `${prefix}-${slug}-${vSlug}-` : `${prefix}-${slug}-`;
  let max = 0;
  for (const p of state) {
    if (p.id === excludeId) continue;
    if (!p.sku.startsWith(head)) continue;
    const tail = p.sku.slice(head.length);
    const n = parseInt(tail, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  let n = max + 1;
  let sku = `${head}${String(n).padStart(3, "0")}`;
  while (isSkuTaken(sku, excludeId)) {
    n += 1;
    sku = `${head}${String(n).padStart(3, "0")}`;
  }
  return sku;
}

