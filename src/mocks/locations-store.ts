import { useSyncExternalStore } from "react";

const KEY = "fixflow.locations";

function loadInitial(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as string[];
    }
  } catch { /* ignore */ }
  return [];
}

let state: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function emit() {
  state = [...state];
  persist();
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = loadInitial();
}

const subscribe = (l: () => void) => {
  hydrate();
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => state;
const getServerSnapshot = () => state;

export function useLocations(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function seedLocations(seed: string[]): void {
  hydrate();
  if (state.length > 0) return;
  state = Array.from(new Set(seed.filter(Boolean)));
  emit();
}

export function addLocation(code: string): void {
  hydrate();
  const c = code.trim();
  if (!c) return;
  if (state.includes(c)) return;
  state.push(c);
  emit();
}

export function renameLocation(oldCode: string, newCode: string): void {
  hydrate();
  const n = newCode.trim();
  if (!n) return;
  const idx = state.indexOf(oldCode);
  if (idx === -1) return;
  state[idx] = n;
  emit();
}

export function removeLocation(code: string): void {
  hydrate();
  const idx = state.indexOf(code);
  if (idx === -1) return;
  state.splice(idx, 1);
  emit();
}
