import { REPAIRS, PARTS, ACTIVITY, STAFF, SHOP, WARRANTIES, NOTIFICATION_TEMPLATES } from "./data";
import { listCustomers, getCustomer } from "./customers-store";
import type { RepairStatus, PartCategory } from "./types";

export { SHOP, STAFF, ACTIVITY, NOTIFICATION_TEMPLATES };

export const allRepairs = () => REPAIRS;
export const getRepairById = (id: string) => REPAIRS.find((r) => r.id === id);
export const getRepairByTrackingCode = (code: string) =>
  REPAIRS.find((r) => r.trackingCode?.toLowerCase() === code.toLowerCase());
export const repairsByStatus = (s?: RepairStatus) =>
  s ? REPAIRS.filter((r) => r.status === s) : REPAIRS;
export const overdueRepairs = () =>
  REPAIRS.filter((r) => r.ageDays >= 7 && r.status !== "picked_up");
export const overdueByTier = () => {
  const open = overdueRepairs();
  return {
    t7: open.filter((r) => r.ageDays >= 7 && r.ageDays < 30),
    t30: open.filter((r) => r.ageDays >= 30 && r.ageDays < 90),
    t90: open.filter((r) => r.ageDays >= 90),
  };
};

export const todayStats = () => {
  const todayDate = "2025-06-11";
  const received = REPAIRS.filter((r) => r.createdAt.startsWith(todayDate)).length;
  const completed = REPAIRS.filter(
    (r) => r.updatedAt.startsWith(todayDate) && (r.status === "completed" || r.status === "picked_up"),
  ).length;
  const revenue = REPAIRS.filter((r) => r.updatedAt.startsWith(todayDate) && r.status === "completed")
    .reduce((s, r) => s + r.estimatedPrice, 0);
  return { received, completed, revenue };
};

export const allCustomers = () => listCustomers();
export const getCustomerById = (id: string) => getCustomer(id);
export const repairsByCustomer = (id: string) => REPAIRS.filter((r) => r.customerId === id);
export const repairsByImei = (imei: string) => {
  const needle = imei.trim().toLowerCase();
  if (!needle) return [];
  return REPAIRS.filter((r) => r.imei.toLowerCase() === needle);
};

export const allParts = () => PARTS;
export const partsByCategory = (c?: PartCategory) =>
  c ? PARTS.filter((p) => p.category === c) : PARTS;
export const lowStockParts = () => PARTS.filter((p) => p.stock <= p.minStock);
export const getPartById = (id: string) => PARTS.find((p) => p.id === id);

export const allWarranties = () => WARRANTIES;
export const getWarrantyById = (id: string) => WARRANTIES.find((w) => w.id === id);
export const warrantiesByCustomer = (id: string) => WARRANTIES.filter((w) => w.customerId === id);
export const warrantiesExpiringSoon = () => WARRANTIES.filter((w) => w.status === "expiring");
export const notificationTemplates = () => NOTIFICATION_TEMPLATES;

export const fmtBaht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

// === Operational helpers (dashboard) ===
const TODAY_ISO = "2025-06-11";
export const openToday = () =>
  REPAIRS.filter(
    (r) => r.createdAt.startsWith(TODAY_ISO) && r.status !== "picked_up" && r.status !== "completed",
  );
export const overSla = (days = 3) =>
  REPAIRS.filter(
    (r) => r.status !== "picked_up" && r.status !== "completed" && r.ageDays > days,
  );
export const waitingPartsOver = (days = 7) =>
  REPAIRS.filter((r) => r.status === "waiting_parts" && r.ageDays > days);

// === Global search corpus (command palette) ===
export type SearchHit =
  | { kind: "repair"; id: string; title: string; sub: string }
  | { kind: "customer"; id: string; title: string; sub: string }
  | { kind: "part"; id: string; title: string; sub: string }
  | { kind: "track"; code: string; title: string; sub: string };

export const searchAll = (raw: string): SearchHit[] => {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  const tr = REPAIRS.find((r) => r.trackingCode?.toLowerCase() === q);
  if (tr?.trackingCode) {
    hits.push({ kind: "track", code: tr.trackingCode, title: tr.trackingCode, sub: `${tr.brand} ${tr.model} · ${tr.customerName}` });
  }

  for (const r of REPAIRS) {
    if (hits.length > 25) break;
    if (
      r.id.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      `${r.brand} ${r.model}`.toLowerCase().includes(q) ||
      r.imei.toLowerCase().includes(q) ||
      r.trackingCode?.toLowerCase().includes(q)
    ) {
      hits.push({ kind: "repair", id: r.id, title: `${r.id} · ${r.brand} ${r.model}`, sub: `${r.customerName} · ${r.phone}` });
    }
  }
  for (const c of listCustomers()) {
    if (hits.length > 40) break;
    if (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.lineId?.toLowerCase().includes(q)
    ) {
      hits.push({ kind: "customer", id: c.id, title: c.name, sub: `${c.phone}${c.lineId ? ` · LINE ${c.lineId}` : ""}` });
    }
  }
  for (const p of PARTS) {
    if (hits.length > 55) break;
    if (p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) {
      hits.push({ kind: "part", id: p.id, title: p.name, sub: `${p.sku} · เหลือ ${p.stock}` });
    }
  }
  return hits;
};

