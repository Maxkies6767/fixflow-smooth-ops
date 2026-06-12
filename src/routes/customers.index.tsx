import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, ShieldCheck, Sparkles, Trash2, UserPlus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/fixflow/section";
import { WarrantyCard } from "@/components/fixflow/warranty-card";
import { StatusBadge } from "@/components/fixflow/status-badge";
import { CustomerAddDialog } from "@/components/fixflow/customer-add-dialog";
import { allRepairs, fmtBaht } from "@/mocks";
import { useCustomers, deleteCustomer } from "@/mocks/customers-store";
import { useWarrantiesList } from "@/mocks/warranty-store";
import type { RepairStatus, WarrantyStatus } from "@/mocks/types";
import { STATUS_LABEL, WARRANTY_STATUS_LABEL } from "@/mocks/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "ลูกค้า · FIXFLOW" },
      { name: "description", content: "ฐานข้อมูลลูกค้า ประวัติซ่อม การรับประกัน และโน้ต CRM" },
    ],
  }),
  component: CustomersPage,
});

type TabKey = "list" | "history" | "warranty" | "crm";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "list", label: "ลูกค้าทั้งหมด" },
  { key: "history", label: "ประวัติซ่อม" },
  { key: "warranty", label: "รับประกัน / เคลม" },
  { key: "crm", label: "CRM" },
];

function CustomersPage() {
  const [tab, setTab] = useState<TabKey>("list");
  const [addOpen, setAddOpen] = useState(false);
  const customers = useCustomers();

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 pb-24 lg:pb-10 max-w-5xl mx-auto">
      <PageHeader
        title="ลูกค้า"
        subtitle={`${customers.length} รายชื่อ · ยอดรวม ${fmtBaht(customers.reduce((s, c) => s + c.totalSpent, 0))}`}
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 py-2 text-xs font-semibold min-h-[40px]"
          >
            <UserPlus className="size-3.5" /> เพิ่มลูกค้า
          </button>
        }
      />
      <CustomerAddDialog open={addOpen} onOpenChange={setAddOpen} />

      <div className="-mx-4 lg:-mx-10 px-4 lg:px-10 mb-4 sticky top-0 bg-background/95 backdrop-blur z-10 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 py-2 w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-medium ring-1 transition-colors min-h-[40px]",
                tab === t.key
                  ? "bg-foreground text-background ring-foreground shadow-sm"
                  : "bg-card text-muted-foreground ring-border hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>


      {tab === "list" && <CustomerListTab />}
      {tab === "history" && <HistoryTab />}
      {tab === "warranty" && <WarrantyTab />}
      {tab === "crm" && <CrmTab />}
    </div>
  );
}

function CustomerListTab() {
  const [q, setQ] = useState("");
  const all = useCustomers();
  const filtered = all.filter((c) => !q || (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`ลบลูกค้า "${name}" ?\n(ประวัติงานซ่อมจะยังคงอยู่แต่จะไม่เชื่อมโยงกับชื่อในระบบ)`)) return;
    if (deleteCustomer(id)) toast.success("ลบลูกค้าแล้ว");
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อ หรือเบอร์โทรศัพท์"
          className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none pl-10 pr-4 h-12 text-[15px]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{all.length === 0 ? "ยังไม่มีลูกค้าในระบบ" : "ไม่พบลูกค้าที่ตรงกับเงื่อนไข"}</p>
          {all.length === 0 && (
            <p className="text-xs mt-1">กดปุ่ม "เพิ่มลูกค้า" ด้านบนเพื่อเริ่มต้น</p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-3 pr-2 hover:ring-brand/30 transition-all min-h-[64px]"
            >
              <Link
                to="/customers/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="size-11 rounded-full bg-muted grid place-items-center text-xs font-semibold text-muted-foreground shrink-0">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    {c.visits >= 4 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand/10 text-brand">VIP</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.phone} · {c.visits} ครั้ง · {fmtBaht(c.totalSpent)}</p>
                </div>
              </Link>
              <Link
                to="/repairs/new"
                search={{ customerId: c.id }}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-brand/10 text-brand px-3 min-h-[44px] text-xs font-semibold hover:bg-brand/15"
                aria-label="รับเครื่องใหม่จากลูกค้านี้"
              >
                <Wrench className="size-3.5" /> รับเครื่อง
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(c.id, c.name)}
                className="shrink-0 size-10 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-rose-600"
                aria-label="ลบลูกค้า"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const HISTORY_FILTERS: Array<{ key: "all" | RepairStatus; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "received", label: STATUS_LABEL.received },
  { key: "diagnosing", label: STATUS_LABEL.diagnosing },
  { key: "waiting_parts", label: STATUS_LABEL.waiting_parts },
  { key: "repairing", label: STATUS_LABEL.repairing },
  { key: "completed", label: STATUS_LABEL.completed },
  { key: "picked_up", label: STATUS_LABEL.picked_up },
];

function HistoryTab() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | RepairStatus>("all");
  const repairs = useMemo(
    () => [...allRepairs()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [],
  );
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return repairs.filter((r) => {
      if (f !== "all" && r.status !== f) return false;
      if (!needle) return true;
      return (
        r.id.toLowerCase().includes(needle) ||
        r.customerName.toLowerCase().includes(needle) ||
        r.phone.toLowerCase().includes(needle) ||
        `${r.brand} ${r.model}`.toLowerCase().includes(needle) ||
        r.problem.toLowerCase().includes(needle) ||
        STATUS_LABEL[r.status].toLowerCase().includes(needle)
      );
    });
  }, [repairs, q, f]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาประวัติซ่อม เลขงาน / ลูกค้า / รุ่นเครื่อง / อาการเสีย"
          className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none pl-10 pr-4 h-11 text-sm"
        />
      </div>
      <div className="-mx-4 lg:-mx-10 px-4 lg:px-10 mb-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 py-1 w-max">
          {HISTORY_FILTERS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setF(opt.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors min-h-[36px]",
                f === opt.key
                  ? "bg-foreground text-background ring-foreground"
                  : "bg-card text-muted-foreground ring-border hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">ไม่พบประวัติที่ตรงกับเงื่อนไข</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to="/repairs/$id"
              params={{ id: r.id }}
              className="block bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-4 hover:ring-brand/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-mono text-[10px] text-muted-foreground">#{r.id}</p>
                    <span className="text-[10px] text-muted-foreground">· รับเครื่อง {r.createdAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{r.customerName} · {r.phone}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.brand} {r.model} — {r.problem}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={r.status} />
                  <span className="text-xs tabular-nums font-semibold">{fmtBaht(r.estimatedPrice)}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>ช่าง: <span className="text-foreground font-medium">{r.technician}</span></span>
                <span className="text-brand font-medium">ดูรายละเอียด →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function WarrantyTab() {
  const [f, setF] = useState<"all" | WarrantyStatus>("all");
  const all = useWarrantiesList();
  const list = f === "all" ? all : all.filter((w) => w.status === f);
  const counts = {
    active: all.filter((w) => w.status === "active").length,
    expiring: all.filter((w) => w.status === "expiring").length,
    expired: all.filter((w) => w.status === "expired").length,
    claimed: all.filter((w) => w.status === "claimed").length,
  };
  const FILTERS: Array<{ key: "all" | WarrantyStatus; label: string }> = [
    { key: "all", label: "ทั้งหมด" },
    { key: "active", label: WARRANTY_STATUS_LABEL.active },
    { key: "expiring", label: WARRANTY_STATUS_LABEL.expiring },
    { key: "expired", label: WARRANTY_STATUS_LABEL.expired },
    { key: "claimed", label: WARRANTY_STATUS_LABEL.claimed },
  ];

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <MiniStat label="ใช้งานอยู่" value={counts.active} tone="text-emerald-600" />
        <MiniStat label="ใกล้หมด" value={counts.expiring} tone="text-amber-600" />
        <MiniStat label="หมดอายุ" value={counts.expired} tone="text-zinc-500" />
        <MiniStat label="เคลมแล้ว" value={counts.claimed} tone="text-teal-600" />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2 mb-3">
        {FILTERS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setF(opt.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
              f === opt.key
                ? "bg-foreground text-background ring-foreground"
                : "bg-card text-muted-foreground ring-border hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
        <Link
          to="/warranty"
          className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-brand/30 text-brand hover:bg-brand/5"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <ShieldCheck className="size-8 mx-auto mb-2 opacity-30" />
            ไม่มีรายการในกลุ่มนี้
          </div>
        ) : (
          list.map((w) => <WarrantyCard key={w.id} w={w} />)
        )}
      </div>
    </div>
  );
}

function CrmTab() {
  const customers = useCustomers().filter((c) => c.note || c.totalSpent > 15000);
  return (
    <div className="space-y-3">
      {customers.map((c) => (
        <Link
          key={c.id}
          to="/customers/$id"
          params={{ id: c.id }}
          className="block bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-4 hover:ring-brand/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold text-muted-foreground">
              {c.name.slice(3, 5)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground">{c.phone} · ยอดรวม {fmtBaht(c.totalSpent)}</p>
            </div>
            {c.totalSpent > 15000 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                <Sparkles className="size-3" /> VIP
              </span>
            )}
          </div>
          {c.note && (
            <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg p-2.5 leading-relaxed">
              {c.note}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold tabular-nums leading-none mt-1 ${tone}`}>
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}
