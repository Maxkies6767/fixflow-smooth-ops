import { useEffect, useSyncExternalStore } from "react";
import { REPAIRS } from "./data";
import type { Repair, RepairStatus } from "./types";
import { adjustStock, getAllParts } from "./parts-store";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "./activity-log-store";

// In-memory mirror of public.repairs. Hydrated from DB on app load and kept
// in sync via Supabase Realtime. All mutations write through to the database
// asynchronously (optimistic local update first).

let state: Repair[] = REPAIRS;
const listeners = new Set<() => void>();

const emit = () => {
  state = [...state];
  REPAIRS.splice(0, REPAIRS.length, ...state);
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

// ---------- DB sync ----------

function recomputeAgeDays(r: Repair): Repair {
  const created = new Date(r.createdAt).getTime();
  const ageDays = Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
  return { ...r, ageDays };
}

async function persist(repair: Repair) {
  const row = {
    id: repair.id,
    // Cast the rich Repair object into Supabase's Json type for the jsonb column.
    data: repair as unknown as never,
    tracking_code: repair.trackingCode?.toLowerCase() ?? null,
    status: repair.status,
  };
  const { error } = await supabase.from("repairs").upsert(row, { onConflict: "id" });
  if (error) console.error("[repairs] upsert failed", error);
}

async function removeRow(id: string) {
  const { error } = await supabase.from("repairs").delete().eq("id", id);
  if (error) console.error("[repairs] delete failed", error);
}

let hydrated = false;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

async function hydrate() {
  const { data, error } = await supabase
    .from("repairs")
    .select("data, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[repairs] hydrate failed", error);
    return;
  }
  state = (data ?? []).map((row) => recomputeAgeDays(row.data as unknown as Repair));
  emit();
  hydrated = true;
}

function subscribeRealtime() {
  if (realtimeChannel || typeof window === "undefined") return;
  realtimeChannel = supabase
    .channel("repairs-store")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "repairs" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const oldRow = payload.old as { id?: string };
          if (!oldRow.id) return;
          state = state.filter((r) => r.id !== oldRow.id);
          emit();
          return;
        }
        const newRow = payload.new as { id: string; data: Repair };
        const repair = recomputeAgeDays(newRow.data);
        const idx = state.findIndex((r) => r.id === repair.id);
        if (idx === -1) state = [repair, ...state];
        else state = state.map((r, i) => (i === idx ? repair : r));
        emit();
      },
    )
    .subscribe();
}

function ensureInit() {
  if (typeof window === "undefined") return;
  subscribeRealtime();
  if (!hydrated) void hydrate();
}

// Re-hydrate on sign-in / sign-out so the right rows appear.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      hydrated = false;
      if (event === "SIGNED_OUT") {
        state = [];
        emit();
      } else {
        void hydrate();
      }
    }
  });
}

// ---------- Hooks ----------

export function useRepairsList(): Repair[] {
  useEffect(ensureInit, []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useRepair(id: string): Repair | undefined {
  useEffect(ensureInit, []);
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return all.find((r) => r.id === id);
}

// ---------- Mutations ----------

export function createRepair(
  input: Omit<Repair, "id" | "createdAt" | "updatedAt" | "ageDays" | "notes" | "partsUsed"> & {
    notes?: Repair["notes"];
    partsUsed?: Repair["partsUsed"];
  },
): Repair {
  const now = new Date().toISOString();
  const existingNums = state
    .map((r) => Number((r.id.match(/RE-(\d+)/) || [])[1]))
    .filter((n) => Number.isFinite(n)) as number[];
  const nextNum = (existingNums.length ? Math.max(...existingNums) : 8800) + 1;
  const id = `RE-${nextNum}`;
  const repair: Repair = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
    ageDays: 0,
    partsUsed: input.partsUsed ?? [],
    notes: input.notes ?? [{ at: now, by: "ฉัน", text: "เปิดใบรับเครื่อง" }],
  };
  state = [repair, ...state];
  emit();
  void persist(repair);
  logActivity({
    level: "create",
    category: "repair",
    message: `สร้างใบงาน ${repair.id} · ${repair.brand} ${repair.model} (${repair.customerName})`,
    refId: repair.id,
  });
  return repair;
}

function update(id: string, patch: (r: Repair) => Repair): Repair | null {
  const idx = state.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const next = { ...patch(state[idx]), updatedAt: new Date().toISOString() };
  state[idx] = next;
  emit();
  void persist(next);
  return next;
}

export function setRepairStatus(id: string, status: RepairStatus, by = "ฉัน"): Repair | null {
  const result = update(id, (r) => ({
    ...r,
    status,
    notes: [
      { at: new Date().toISOString(), by, text: `เปลี่ยนสถานะเป็น "${status}"` },
      ...r.notes,
    ],
  }));
  if (result) {
    logActivity({
      level: "update",
      category: "repair",
      message: `เปลี่ยนสถานะใบงาน ${id} → "${status}"`,
      refId: id,
      actor: by,
    });
  }
  return result;
}

export function addPartToRepair(
  repairId: string,
  input: { partId: string; qty: number; by?: string },
): { issued: number; requested: number; shortage: number } | null {
  const part = getAllParts().find((p) => p.id === input.partId);
  if (!part) return null;
  const requested = Math.max(0, Math.floor(input.qty));
  if (requested === 0) return { issued: 0, requested: 0, shortage: 0 };

  const available = part.stock;
  const issued = Math.min(available, requested);
  const shortage = requested - issued;

  if (issued > 0) {
    adjustStock(part.id, -issued, {
      type: "out",
      refRepairId: repairId,
      note: `เบิกเข้าใบงาน ${repairId}`,
      by: input.by,
    });
  }

  update(repairId, (r) => {
    const existingIdx = r.partsUsed.findIndex((x) => x.partId === part.id);
    const next = [...r.partsUsed];
    if (existingIdx >= 0) {
      next[existingIdx] = { ...next[existingIdx], qty: next[existingIdx].qty + issued };
    } else if (issued > 0) {
      next.push({ partId: part.id, sku: part.sku, name: part.name, qty: issued, price: part.price });
    }
    const nextStatus: RepairStatus = shortage > 0 ? "waiting_parts" : r.status;
    const noteText =
      shortage > 0
        ? `เบิก ${part.name} ${issued}/${requested} ชิ้น (ขาด ${shortage}) — เปลี่ยนสถานะเป็น "รออะไหล่"`
        : `เบิก ${part.name} ${issued} ชิ้น`;
    return {
      ...r,
      partsUsed: next,
      status: nextStatus,
      notes: [{ at: new Date().toISOString(), by: input.by ?? "ฉัน", text: noteText }, ...r.notes],
    };
  });

  logActivity({
    level: "issue",
    category: "repair",
    message:
      shortage > 0
        ? `เบิก ${part.name} ${issued}/${requested} เข้าใบงาน ${repairId} (ขาด ${shortage})`
        : `เบิก ${part.name} ${issued} ชิ้น เข้าใบงาน ${repairId}`,
    refId: repairId,
    actor: input.by,
  });

  return { issued, requested, shortage };
}

export function returnPartFromRepair(
  repairId: string,
  partId: string,
  qty: number,
  by = "ฉัน",
): Repair | null {
  const repair = state.find((r) => r.id === repairId);
  if (!repair) return null;
  const entry = repair.partsUsed.find((p) => p.partId === partId);
  if (!entry) return null;
  const returnQty = Math.min(entry.qty, Math.max(0, Math.floor(qty)));
  if (returnQty === 0) return repair;

  adjustStock(partId, returnQty, {
    type: "in",
    refRepairId: repairId,
    note: `คืนจากใบงาน ${repairId}`,
    by,
  });

  const result = update(repairId, (r) => {
    const next = r.partsUsed
      .map((p) => (p.partId === partId ? { ...p, qty: p.qty - returnQty } : p))
      .filter((p) => p.qty > 0);
    return {
      ...r,
      partsUsed: next,
      notes: [
        { at: new Date().toISOString(), by, text: `คืน ${entry.name} ${returnQty} ชิ้นเข้าสต็อก` },
        ...r.notes,
      ],
    };
  });
  logActivity({
    level: "return",
    category: "repair",
    message: `คืน ${entry.name} ${returnQty} ชิ้นจากใบงาน ${repairId}`,
    refId: repairId,
    actor: by,
  });
  return result;
}

export function cancelRepair(repairId: string, by = "ฉัน"): Repair | null {
  const repair = state.find((r) => r.id === repairId);
  if (!repair) return null;
  for (const p of repair.partsUsed) {
    if (p.partId && p.qty > 0) {
      adjustStock(p.partId, p.qty, {
        type: "in",
        refRepairId: repairId,
        note: `คืนจากการยกเลิกใบงาน ${repairId}`,
        by,
      });
    }
  }
  const result = update(repairId, (r) => ({
    ...r,
    status: "canceled",
    partsUsed: [],
    notes: [
      { at: new Date().toISOString(), by, text: "ยกเลิกใบงาน — คืนอะไหล่ทั้งหมดเข้าสต็อก" },
      ...r.notes,
    ],
  }));
  logActivity({
    level: "delete",
    category: "repair",
    message: `ยกเลิกใบงาน ${repairId} — คืนอะไหล่ทั้งหมดเข้าสต็อก`,
    refId: repairId,
    actor: by,
  });
  return result;
}

export function attachIssuedPartToRepair(
  repairId: string,
  input: { partId: string; qty: number },
): Repair | null {
  const part = getAllParts().find((p) => p.id === input.partId);
  if (!part) return null;
  const qty = Math.max(0, Math.floor(input.qty));
  if (qty === 0) return null;

  return update(repairId, (r) => {
    const idx = r.partsUsed.findIndex((x) => x.partId === part.id);
    const next = [...r.partsUsed];
    if (idx >= 0) {
      next[idx] = { ...next[idx], qty: next[idx].qty + qty };
    } else {
      next.push({ partId: part.id, sku: part.sku, name: part.name, qty, price: part.price });
    }
    return { ...r, partsUsed: next };
  });
}

export function startWorkSession(repairId: string, by = "ฉัน"): Repair | null {
  return update(repairId, (r) => {
    const sessions = r.workSessions ?? [];
    if (sessions.some((s) => !s.end)) return r;
    const newSession = { id: `ws-${Date.now()}`, start: new Date().toISOString(), by };
    return {
      ...r,
      workSessions: [...sessions, newSession],
      notes: [{ at: newSession.start, by, text: "เริ่มจับเวลาทำงาน" }, ...r.notes],
    };
  });
}

export function stopWorkSession(repairId: string, by = "ฉัน"): Repair | null {
  return update(repairId, (r) => {
    const sessions = r.workSessions ?? [];
    const idx = sessions.findIndex((s) => !s.end);
    if (idx === -1) return r;
    const now = new Date().toISOString();
    const next = [...sessions];
    const started = new Date(next[idx].start).getTime();
    const elapsedMin = Math.max(0, Math.round((Date.now() - started) / 60000));
    next[idx] = { ...next[idx], end: now };
    return {
      ...r,
      workSessions: next,
      notes: [{ at: now, by, text: `หยุดจับเวลา (${formatMinutes(elapsedMin)})` }, ...r.notes],
    };
  });
}

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h} ชม. ${m} นาที`;
  return `${m} นาที`;
}

export function totalWorkMinutes(r: Repair): number {
  const sessions = r.workSessions ?? [];
  let total = 0;
  for (const s of sessions) {
    const end = s.end ? new Date(s.end).getTime() : Date.now();
    total += Math.max(0, Math.round((end - new Date(s.start).getTime()) / 60000));
  }
  return total;
}

export async function deleteRepair(id: string): Promise<void> {
  state = state.filter((r) => r.id !== id);
  emit();
  await removeRow(id);
  logActivity({
    level: "delete",
    category: "repair",
    message: `ลบใบงาน ${id}`,
    refId: id,
  });
}
