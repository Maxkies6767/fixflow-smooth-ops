import { useSyncExternalStore } from "react";

export interface SymptomTemplate {
  id: string;
  text: string;
  category?: string;
}

const SEED: SymptomTemplate[] = [
  { id: "t1", text: "หน้าจอแตก ทัชไม่ติด", category: "หน้าจอ" },
  { id: "t2", text: "แบตหมดเร็ว ใช้ได้ไม่ถึงครึ่งวัน", category: "แบตเตอรี่" },
  { id: "t3", text: "ชาร์จไม่เข้า ลองสายอื่นแล้วไม่หาย", category: "พอร์ตชาร์จ" },
  { id: "t4", text: "เครื่องเปิดไม่ติด กดปุ่มไม่ตอบสนอง", category: "บอร์ด" },
  { id: "t5", text: "กล้องหลังเบลอ โฟกัสไม่ได้", category: "กล้อง" },
  { id: "t6", text: "ลำโพงไม่มีเสียง / เสียงแตก", category: "เสียง" },
  { id: "t7", text: "ไมค์โทรออกคู่สนทนาไม่ได้ยิน", category: "เสียง" },
  { id: "t8", text: "เครื่องเปียกน้ำ", category: "บอร์ด" },
];

const KEY = "fixflow.symptomTemplates";
const EVT = "fixflow:symptom-templates-changed";

let memory: SymptomTemplate[] = [...SEED];
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw) as SymptomTemplate[];
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

function getSnapshot() {
  hydrate();
  return memory;
}

function getServerSnapshot() {
  return SEED;
}

export function useSymptomTemplates(): SymptomTemplate[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addSymptomTemplate(text: string, category?: string) {
  const t = text.trim();
  if (!t) return null;
  const tpl: SymptomTemplate = {
    id: `st-${Date.now()}`,
    text: t,
    category: category?.trim() || undefined,
  };
  memory = [tpl, ...memory];
  persist();
  return tpl;
}

export function removeSymptomTemplate(id: string) {
  memory = memory.filter((t) => t.id !== id);
  persist();
}

export function resetSymptomTemplates() {
  memory = [...SEED];
  persist();
}
