import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActivityLevel =
  | "info"
  | "create"
  | "update"
  | "delete"
  | "issue"
  | "return"
  | "auth"
  | "warn";

export type ActivityCategory =
  | "repair"
  | "part"
  | "stock"
  | "customer"
  | "warranty"
  | "staff"
  | "settings"
  | "auth"
  | "other";

export interface ActivityEvent {
  id: string;
  at: string;
  actor: string;
  level: ActivityLevel;
  category: ActivityCategory;
  message: string;
  refId?: string;
}

const LEGACY_KEY = "fixflow.activity.v1";
const MIGRATION_DONE_KEY = "fixflow.activity.migrated.v1";
const PAGE_SIZE = 500;
const listeners = new Set<() => void>();

let cache: ActivityEvent[] = [];
let loaded = false;
let loading = false;
let actor = "system";
let actorId: string | null = null;

export function setActivityActor(name: string | null | undefined, id?: string | null) {
  actor = (name && name.trim()) || "system";
  actorId = id ?? null;
}
export function getActivityActor() {
  return actor;
}

function rowToEvent(row: {
  id: string;
  at: string;
  actor_name: string;
  level: string;
  category: string;
  message: string;
  ref_id: string | null;
}): ActivityEvent {
  return {
    id: row.id,
    at: row.at,
    actor: row.actor_name,
    level: row.level as ActivityLevel,
    category: row.category as ActivityCategory,
    message: row.message,
    refId: row.ref_id ?? undefined,
  };
}

function notify() {
  listeners.forEach((l) => l());
}

async function loadInitial() {
  if (loaded || loading) return;
  loading = true;
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, at, actor_name, level, category, message, ref_id")
      .order("at", { ascending: false })
      .limit(PAGE_SIZE);
    if (!error && data) {
      cache = data.map(rowToEvent);
      loaded = true;
      notify();
    }
  } finally {
    loading = false;
  }
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
function subscribeRealtime() {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel("activity_logs_changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "activity_logs" },
      (payload) => {
        const evt = rowToEvent(payload.new as Parameters<typeof rowToEvent>[0]);
        if (cache.some((e) => e.id === evt.id)) return;
        cache = [evt, ...cache].slice(0, PAGE_SIZE);
        notify();
      },
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "activity_logs" },
      (payload) => {
        const oldRow = payload.old as { id?: string };
        if (!oldRow?.id) {
          cache = [];
        } else {
          cache = cache.filter((e) => e.id !== oldRow.id);
        }
        notify();
      },
    )
    .subscribe();
}

export function logActivity(input: {
  level: ActivityLevel;
  category: ActivityCategory;
  message: string;
  refId?: string;
  actor?: string;
}) {
  try {
    const actorName = (input.actor && input.actor.trim()) || actor;
    void supabase
      .from("activity_logs")
      .insert({
        actor_id: actorId,
        actor_name: actorName,
        level: input.level,
        category: input.category,
        message: input.message,
        ref_id: input.refId ?? null,
      })
      .then(() => {
        /* realtime will deliver */
      });
  } catch {
    /* fire-and-forget */
  }
}

export async function clearActivityLog() {
  const { error } = await supabase.from("activity_logs").delete().not("id", "is", null);
  if (!error) {
    cache = [];
    notify();
  } else {
    throw error;
  }
}

export async function purgeOldActivityLogs() {
  try {
    await supabase.rpc("purge_old_activity_logs");
  } catch {
    /* ignore */
  }
}

export async function migrateLocalActivityLogs(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return 0;
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      return 0;
    }
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) {
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      return 0;
    }
    const rows = arr
      .filter((e) => e && e.message && e.level && e.category)
      .map((e: ActivityEvent) => ({
        actor_id: null,
        actor_name: e.actor || "legacy",
        level: e.level,
        category: e.category,
        message: e.message,
        ref_id: e.refId ?? null,
        at: e.at || new Date().toISOString(),
      }));
    if (rows.length === 0) {
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      return 0;
    }
    // chunked insert (avoid huge payloads)
    const chunk = 200;
    for (let i = 0; i < rows.length; i += chunk) {
      const { error } = await supabase.from("activity_logs").insert(rows.slice(i, i + chunk));
      if (error) throw error;
    }
    localStorage.removeItem(LEGACY_KEY);
    localStorage.setItem(MIGRATION_DONE_KEY, "1");
    // refresh cache
    loaded = false;
    await loadInitial();
    return rows.length;
  } catch {
    return 0;
  }
}

export function useActivityLog(): ActivityEvent[] {
  useEffect(() => {
    void loadInitial();
    subscribeRealtime();
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => [],
  );
}
