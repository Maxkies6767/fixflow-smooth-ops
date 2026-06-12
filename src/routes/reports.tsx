import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, TrendingUp, Wrench, Package, Users } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/fixflow/section";
import { useRepairsList, totalWorkMinutes } from "@/mocks/repairs-store";
import { allParts, fmtBaht } from "@/mocks";
import { useShopSettings } from "@/mocks/shop-settings";
import { STATUS_LABEL, type RepairStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";
import { exportToCsv, exportToXlsx } from "@/lib/export";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "รายงาน · FIXFLOW" },
      { name: "description", content: "Dashboard ผู้บริหาร — ยอดขาย กำไรต่อช่าง และอะไหล่ขายดี" },
    ],
  }),
  component: ReportsPage,
});

type RangeKey = "today" | "7d" | "30d" | "all";
const RANGES: Array<{ key: RangeKey; label: string; days: number | null }> = [
  { key: "today", label: "วันนี้", days: 1 },
  { key: "7d", label: "7 วัน", days: 7 },
  { key: "30d", label: "30 วัน", days: 30 },
  { key: "all", label: "ทั้งหมด", days: null },
];

function withinRange(iso: string, days: number | null): boolean {
  if (days === null) return true;
  const t = new Date(iso).getTime();
  const cutoff = Date.now() - days * 86400000;
  return t >= cutoff;
}

const PIE_COLORS = ["#3b82f6", "#a855f7", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#64748b"];

function ReportsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const repairs = useRepairsList();
  const parts = allParts();
  const shop = useShopSettings();

  const cfg = RANGES.find((r) => r.key === range)!;
  const closedStatuses: RepairStatus[] = ["completed", "picked_up"];

  const inRange = useMemo(
    () => repairs.filter((r) => withinRange(r.createdAt, cfg.days)),
    [repairs, cfg.days],
  );
  const closedInRange = useMemo(
    () => repairs.filter((r) => closedStatuses.includes(r.status) && withinRange(r.updatedAt, cfg.days)),
    [repairs, cfg.days],
  );

  // KPIs
  const revenue = closedInRange.reduce((s, r) => {
    const labor = Math.round((totalWorkMinutes(r) / 60) * (r.laborRatePerHour ?? shop.laborRatePerHour));
    return s + r.estimatedPrice + labor;
  }, 0);
  const newJobs = inRange.length;
  const closedJobs = closedInRange.length;
  const openJobs = repairs.filter((r) => r.status !== "picked_up" && r.status !== "canceled" && r.status !== "completed").length;

  // Daily revenue series (last N days)
  const days = cfg.days ?? 30;
  const dailySeries = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const r of closedInRange) {
      const day = r.updatedAt.slice(0, 10);
      if (day in buckets) {
        const labor = Math.round((totalWorkMinutes(r) / 60) * (r.laborRatePerHour ?? shop.laborRatePerHour));
        buckets[day] += r.estimatedPrice + labor;
      }
    }
    return Object.entries(buckets).map(([date, value]) => ({
      date: date.slice(5),
      value,
    }));
  }, [closedInRange, days, shop.laborRatePerHour]);

  // Status distribution (current snapshot)
  const statusDist = useMemo(() => {
    const m: Partial<Record<RepairStatus, number>> = {};
    for (const r of repairs) m[r.status] = (m[r.status] ?? 0) + 1;
    return Object.entries(m).map(([k, v]) => ({ name: STATUS_LABEL[k as RepairStatus], value: v as number }));
  }, [repairs]);

  // Top parts
  const topParts = useMemo(() => {
    const m = new Map<string, { name: string; sku?: string; qty: number; revenue: number }>();
    for (const r of closedInRange) {
      for (const p of r.partsUsed) {
        const key = p.partId ?? p.sku ?? p.name;
        const cur = m.get(key) ?? { name: p.name, sku: p.sku, qty: 0, revenue: 0 };
        cur.qty += p.qty;
        cur.revenue += p.qty * p.price;
        m.set(key, cur);
      }
    }
    return Array.from(m.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [closedInRange]);

  // Profit per technician
  const techRows = useMemo(() => {
    const m = new Map<string, { tech: string; jobs: number; revenue: number; laborCost: number; partsRevenue: number; partsCost: number }>();
    for (const r of closedInRange) {
      const t = r.technician || "—";
      const cur = m.get(t) ?? { tech: t, jobs: 0, revenue: 0, laborCost: 0, partsRevenue: 0, partsCost: 0 };
      const laborMin = totalWorkMinutes(r);
      const labor = Math.round((laborMin / 60) * (r.laborRatePerHour ?? shop.laborRatePerHour));
      cur.jobs += 1;
      cur.revenue += r.estimatedPrice + labor;
      cur.laborCost += labor;
      for (const p of r.partsUsed) {
        cur.partsRevenue += p.qty * p.price;
        const meta = parts.find((x) => x.id === p.partId);
        cur.partsCost += (meta?.cost ?? 0) * p.qty;
      }
      m.set(t, cur);
    }
    return Array.from(m.values())
      .map((row) => ({ ...row, profit: row.revenue - row.partsCost }))
      .sort((a, b) => b.profit - a.profit);
  }, [closedInRange, parts, shop.laborRatePerHour]);

  // Exports
  const repairRows = closedInRange.map((r) => ({
    เลขงาน: r.id,
    วันที่: r.createdAt.slice(0, 10),
    ลูกค้า: r.customerName,
    เบอร์: r.phone,
    เครื่อง: `${r.brand} ${r.model}`,
    IMEI: r.imei,
    อาการ: r.problem,
    สถานะ: STATUS_LABEL[r.status],
    ช่าง: r.technician,
    ราคา: r.estimatedPrice,
    มัดจำ: r.deposit,
    ค่าแรง: Math.round((totalWorkMinutes(r) / 60) * (r.laborRatePerHour ?? shop.laborRatePerHour)),
  }));
  const partsRows = topParts.map((p) => ({ SKU: p.sku ?? "", ชื่อ: p.name, จำนวน: p.qty, ยอดขาย: p.revenue }));
  const techRowsExport = techRows.map((t) => ({
    ช่าง: t.tech, งานปิด: t.jobs, ยอดขาย: t.revenue, ค่าแรง: t.laborCost,
    ค่าอะไหล่: t.partsCost, "กำไรประมาณการ": t.profit,
  }));

  const onCsv = () => {
    exportToCsv(repairRows, `repairs-${range}.csv`);
    toast.success("ดาวน์โหลด CSV แล้ว");
  };
  const onXlsx = () => {
    exportToXlsx(
      [
        { name: "งานซ่อม", rows: repairRows },
        { name: "อะไหล่ขายดี", rows: partsRows },
        { name: "กำไรต่อช่าง", rows: techRowsExport },
      ],
      `fixflow-report-${range}.xlsx`,
    );
    toast.success("ดาวน์โหลด Excel แล้ว");
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="รายงาน / ผู้บริหาร"
        subtitle="สรุปยอดขาย กำไร และอะไหล่ขายดี"
        actions={
          <div className="flex gap-2">
            <button
              onClick={onCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-card ring-1 ring-border px-3 h-10 text-sm font-medium hover:bg-accent"
            >
              <Download className="size-4" /> CSV
            </button>
            <button
              onClick={onXlsx}
              className="inline-flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-3 h-10 text-sm font-semibold"
            >
              <FileSpreadsheet className="size-4" /> Excel
            </button>
          </div>
        }
      />

      <div className="flex gap-2 mb-5 overflow-x-auto -mx-1 px-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ring-1 min-h-[36px]",
              range === r.key
                ? "bg-foreground text-background ring-foreground"
                : "bg-card text-muted-foreground ring-border hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={TrendingUp} label="ยอดขาย" value={fmtBaht(revenue)} accent />
        <Kpi icon={Wrench} label="งานใหม่" value={String(newJobs)} />
        <Kpi icon={Package} label="งานปิด" value={String(closedJobs)} />
        <Kpi icon={Users} label="งานค้าง" value={String(openJobs)} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card ring-1 ring-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">รายได้รายวัน</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  formatter={(v: number) => fmtBaht(v)}
                />
                <Bar dataKey="value" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card ring-1 ring-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">สัดส่วนสถานะงาน</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" outerRadius={75} label>
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top parts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card ring-1 ring-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">อะไหล่ขายดี Top 10</h3>
          {topParts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูลในช่วงนี้</p>
          ) : (
            <div className="space-y-1.5">
              {topParts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <span className="size-6 rounded bg-muted text-muted-foreground grid place-items-center text-[10px] font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    {p.sku && <p className="text-[10px] font-mono text-muted-foreground">{p.sku}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">× {p.qty}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">{fmtBaht(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card ring-1 ring-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">กำไรต่อช่าง</h3>
          {techRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีงานปิดในช่วงนี้</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="py-2 font-medium">ช่าง</th>
                    <th className="py-2 font-medium text-right">งาน</th>
                    <th className="py-2 font-medium text-right">ยอดขาย</th>
                    <th className="py-2 font-medium text-right">ต้นทุนอะไหล่</th>
                    <th className="py-2 font-medium text-right">กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {techRows.map((t) => (
                    <tr key={t.tech} className="border-t border-border">
                      <td className="py-2 font-medium">{t.tech}</td>
                      <td className="py-2 text-right tabular-nums">{t.jobs}</td>
                      <td className="py-2 text-right tabular-nums">{fmtBaht(t.revenue)}</td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">{fmtBaht(t.partsCost)}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-brand">{fmtBaht(t.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, accent,
}: { icon: typeof Wrench; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      "bg-card ring-1 ring-border rounded-xl p-4",
      accent && "bg-brand/5 ring-brand/20",
    )}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className={cn("size-3.5 text-muted-foreground", accent && "text-brand")} />
      </div>
      <p className={cn("text-2xl font-semibold tabular-nums leading-none", accent && "text-brand")}>
        {value}
      </p>
    </div>
  );
}

