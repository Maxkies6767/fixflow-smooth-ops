import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Phone, MessageCircle, Sparkles, TrendingUp, PackageX, LayoutGrid, ShieldAlert, Search, ScanLine, Wrench, Clock, AlertTriangle, PackageSearch } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/fixflow/section";
import { RepairCard } from "@/components/fixflow/repair-card";
import { todayStats, overdueByTier, allRepairs, fmtBaht, lowStockParts, ACTIVITY, warrantiesExpiringSoon, openToday, overSla, waitingPartsOver } from "@/mocks";
import { STATUS_LABEL, type RepairStatus } from "@/mocks/types";
import { openCommandPalette } from "@/components/fixflow/command-palette";


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "ภาพรวม · FIXFLOW" },
      { name: "description", content: "ภาพรวมร้าน สถิติประจำวัน และงานค้างของ FIXFLOW" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const stats = todayStats();
  const overdue = overdueByTier();
  const recent = allRepairs().slice(0, 3);
  const lowStock = lowStockParts().slice(0, 3);
  const expiring = warrantiesExpiringSoon();
  const openRepairs = allRepairs().filter((r) => r.status !== "picked_up");
  const queueCounts: Partial<Record<RepairStatus, number>> = {};
  for (const r of openRepairs) queueCounts[r.status] = (queueCounts[r.status] ?? 0) + 1;
  const queueCols: RepairStatus[] = ["received", "diagnosing", "waiting_parts", "repairing", "completed"];

  const opsOpenToday = openToday().length;
  const opsOverSla = overSla(3).length;
  const opsWaitParts = waitingPartsOver(7).length;


  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="ภาพรวมร้าน"
        subtitle="วันพุธที่ 11 มิถุนายน 2568"
        actions={
          <Link
            to="/repairs/new"
            className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-4 py-2.5 text-sm font-semibold min-h-[44px]"
          >
            <Plus className="size-4" />
            รับเครื่องใหม่
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick actions */}
          <section>
            <SectionHeader label="ลัด" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <QuickAction to="/repairs/new" label="รับงานใหม่" icon={Plus} accent />
              <QuickAction onClick={openCommandPalette} label="ค้นหาลูกค้า" icon={Search} />
              <QuickAction to="/inventory/scan" label="สแกน QR/Barcode" icon={ScanLine} />
              <QuickAction to="/repairs/queue" label="เปิด Kanban" icon={LayoutGrid} />
            </div>
          </section>

          {/* Operational cards */}
          <section>
            <SectionHeader label="สถานะปฏิบัติงาน" />
            <div className="grid grid-cols-3 gap-2.5">
              <OpsCard label="งานค้างวันนี้" value={opsOpenToday} icon={Clock} tone="text-foreground" />
              <OpsCard label="เลย SLA >3 วัน" value={opsOverSla} icon={AlertTriangle} tone="text-danger" />
              <OpsCard label="รออะไหล่ >7 วัน" value={opsWaitParts} icon={PackageSearch} tone="text-warning" />
            </div>
          </section>

          {/* Stats */}
          <section>
            <SectionHeader label="สรุปงานวันนี้" />
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="รับเครื่อง" value={String(stats.received).padStart(2, "0")} hint="วันนี้" />
              <StatCard label="ซ่อมเสร็จ" value={String(stats.completed).padStart(2, "0")} accent hint="พร้อมส่งมอบ" />
              <StatCard label="รายได้" value={fmtBaht(stats.revenue)} hint="วันนี้" />
            </div>
          </section>


          {/* Overdue */}
          <section>
            <SectionHeader
              label="งานค้างส่งตามกำหนด"
              action={
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                  อัปเดต 2 นาทีที่แล้ว
                </span>
              }
            />
            <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl divide-y divide-border overflow-hidden">
              <OverdueRow tier="warning" label="เกินกำหนด 7 วัน" count={overdue.t7.length} amount={overdue.t7.reduce((s, r) => s + r.estimatedPrice - r.deposit, 0)} />
              <OverdueRow tier="danger" label="เกินกำหนด 30 วัน" count={overdue.t30.length} amount={overdue.t30.reduce((s, r) => s + r.estimatedPrice - r.deposit, 0)} />
              <OverdueRow tier="critical" label="เกินกำหนด 90 วัน" count={overdue.t90.length} amount={overdue.t90.reduce((s, r) => s + r.estimatedPrice - r.deposit, 0)} />
            </div>
          </section>

          {/* Recent */}
          <section>
            <SectionHeader
              label="งานซ่อมล่าสุด"
              action={<Link to="/repairs" className="text-[11px] font-semibold text-brand">ดูทั้งหมด →</Link>}
            />
            <div className="space-y-3">
              {recent.map((r) => (
                <RepairCard key={r.id} repair={r} />
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Technician Queue summary */}
          <Link to="/repairs/queue" className="block bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 hover:ring-brand/30 transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="size-4 text-brand" />
                คิวช่าง (Kanban)
              </h3>
              <span className="text-[11px] text-brand font-semibold">เปิดบอร์ด →</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {queueCols.map((s) => (
                <div key={s} className="text-center">
                  <p className="text-base font-semibold tabular-nums">{String(queueCounts[s] ?? 0).padStart(2, "0")}</p>
                  <p className="text-[9px] text-muted-foreground line-clamp-1">{STATUS_LABEL[s]}</p>
                </div>
              ))}
            </div>
          </Link>

          {/* Warranty expiring */}
          <Link to="/warranty" className="block bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 hover:ring-brand/30 transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-600" />
                ประกันใกล้หมดอายุ
              </h3>
              <span className="text-[11px] text-brand font-semibold">ดูทั้งหมด →</span>
            </div>
            {expiring.length === 0 ? (
              <p className="text-xs text-muted-foreground">ไม่มีในช่วงนี้</p>
            ) : (
              <div className="space-y-1">
                {expiring.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex justify-between text-sm">
                    <span className="truncate">{w.device}</span>
                    <span className="text-[11px] text-amber-600 font-medium shrink-0 ml-2">→ {w.endDate}</span>
                  </div>
                ))}
              </div>
            )}
          </Link>


          {/* AI Diagnostics */}
          <div className="bg-zinc-900 text-zinc-100 rounded-xl p-5 ring-1 ring-zinc-900 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">AI Diagnostics</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">
              พบรูปแบบ <span className="text-zinc-100 font-medium">"ความร้อน IC Power"</span> ใน iPhone 13 Pro 3 เคสล่าสุดติดกัน — แนะนำตรวจสอบ Tristar
            </p>
            <button className="mt-4 w-full rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold py-2.5 transition-colors flex items-center justify-center gap-2">
              <Sparkles className="size-3.5" />
              ดูคำแนะนำทางเทคนิค
            </button>
          </div>

          {/* Low stock */}
          <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <PackageX className="size-4 text-warning" />
                อะไหล่ใกล้หมด
              </h3>
              <Link to="/inventory" className="text-[11px] text-brand font-semibold">ดูคลัง →</Link>
            </div>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${p.stock === 0 ? "bg-critical text-white" : "bg-warning/15 text-warning"}`}>
                    เหลือ {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">กิจกรรมล่าสุด</h3>
            <div className="space-y-4">
              {ACTIVITY.slice(0, 5).map((a, i) => (
                <div key={a.id} className="relative pl-5 border-l border-border last:border-l-transparent pb-1">
                  <div className={`absolute -left-[4.5px] top-1.5 size-2 rounded-full ${i === 0 ? "bg-brand" : "bg-muted-foreground/30"}`} />
                  <p className="text-sm font-medium leading-tight">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.at} · {a.by}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 p-4 rounded-xl">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <span className={`block text-2xl font-semibold tabular-nums leading-none ${accent ? "text-brand" : ""}`}>{value}</span>
      {hint && <span className="block text-[11px] text-muted-foreground mt-2">{hint}</span>}
    </div>
  );
}

function QuickAction({
  to, onClick, label, icon: Icon, accent,
}: {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: typeof Wrench;
  accent?: boolean;
}) {
  const cls = `flex items-center gap-2.5 rounded-xl p-3 min-h-[56px] ring-1 transition-colors ${
    accent ? "bg-brand text-brand-foreground ring-brand hover:opacity-90" : "bg-card ring-border hover:bg-accent"
  }`;
  const inner = (
    <>
      <span className={`size-9 rounded-lg grid place-items-center shrink-0 ${accent ? "bg-white/15" : "bg-muted"}`}>
        <Icon className="size-4" />
      </span>
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function OpsCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Clock; tone: string }) {
  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
        <Icon className={`size-3.5 ${tone}`} />
      </div>
      <span className={`block text-2xl font-semibold tabular-nums leading-none ${tone}`}>
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}


function OverdueRow({ tier, label, count, amount }: { tier: "warning" | "danger" | "critical"; label: string; count: number; amount: number }) {
  const dot = tier === "warning" ? "bg-warning" : tier === "danger" ? "bg-danger" : "bg-critical";
  const isCrit = tier === "critical";
  return (
    <div className={`flex items-center justify-between p-4 ${isCrit ? "bg-critical/5" : ""}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`size-2 rounded-full ${dot} shrink-0`} />
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isCrit ? "text-critical" : ""}`}>{label}</p>
          <p className="text-xs text-muted-foreground">ค้างชำระ {fmtBaht(amount)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-semibold tabular-nums ${isCrit ? "text-critical" : ""}`}>{String(count).padStart(2, "0")} งาน</span>
        <button className="size-9 grid place-items-center rounded-lg bg-muted hover:bg-accent transition-colors">
          <Phone className="size-4" />
        </button>
        <button className="size-9 grid place-items-center rounded-lg bg-muted hover:bg-accent transition-colors">
          <MessageCircle className="size-4 text-success" />
        </button>
      </div>
    </div>
  );
}
