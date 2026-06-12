import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Phone, MessageCircle, Sparkles, ShieldCheck, FilePlus2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getCustomerById,
  repairsByCustomer,
  warrantiesByCustomer,
  fmtBaht,
} from "@/mocks";
import { deleteCustomer } from "@/mocks/customers-store";
import { StatusBadge } from "@/components/fixflow/status-badge";
import { WarrantyCard } from "@/components/fixflow/warranty-card";
import { cn } from "@/lib/utils";

import type { Customer, Repair, RepairStatus, Warranty } from "@/mocks/types";

type CustomerLoader = { customer: Customer; repairs: Repair[]; warranties: Warranty[] };

export const Route = createFileRoute("/customers/$id")({
  loader: ({ params }): CustomerLoader => {
    const c = getCustomerById(params.id);
    if (!c) throw notFound();
    return {
      customer: c,
      repairs: repairsByCustomer(params.id),
      warranties: warrantiesByCustomer(params.id),
    };
  },
  head: ({ loaderData }: { loaderData?: CustomerLoader }) => ({
    meta: [{ title: `${loaderData?.customer.name ?? "ลูกค้า"} · FIXFLOW` }],
  }),
  notFoundComponent: () => <div className="p-10 text-center text-muted-foreground">ไม่พบลูกค้านี้</div>,
  component: CustomerDetailPage,
});

type Tab = "info" | "repairs" | "warranty" | "crm";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "info", label: "ข้อมูลลูกค้า" },
  { key: "repairs", label: "ประวัติซ่อม" },
  { key: "warranty", label: "รับประกัน" },
  { key: "crm", label: "โน้ต CRM" },
];

function CustomerDetailPage() {
  const { customer, repairs, warranties } = Route.useLoaderData() as CustomerLoader;
  const [tab, setTab] = useState<Tab>("info");
  const navigate = useNavigate();

  const handleDelete = () => {
    if (!confirm(`ลบลูกค้า "${customer.name}" ?`)) return;
    if (deleteCustomer(customer.id)) {
      toast.success("ลบลูกค้าแล้ว");
      navigate({ to: "/customers" });
    }
  };

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-10 py-3 flex items-center gap-2">
        <Link to="/customers" className="size-9 grid place-items-center rounded-lg hover:bg-muted -ml-2">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Customer</p>
          <h1 className="text-lg font-semibold truncate">{customer.name}</h1>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="size-9 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-rose-600"
          aria-label="ลบลูกค้า"
          title="ลบลูกค้า"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="px-4 lg:px-10 py-5 max-w-4xl mx-auto">
        <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-muted grid place-items-center text-sm font-semibold text-muted-foreground">
              {customer.name.slice(3, 5)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold truncate">{customer.name}</h2>
              <p className="text-xs text-muted-foreground truncate">
                {customer.phone}{customer.lineId && ` · LINE: ${customer.lineId}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="size-10 grid place-items-center rounded-lg bg-foreground text-background"><Phone className="size-4" /></button>
              <button className="size-10 grid place-items-center rounded-lg bg-muted"><MessageCircle className="size-4 text-success" /></button>
            </div>
          </div>
          <Link
            to="/repairs/new"
            search={{ customerId: customer.id }}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground min-h-[44px] text-sm font-semibold hover:opacity-90"
          >
            <FilePlus2 className="size-4" /> รับเครื่องใหม่จากลูกค้านี้
          </Link>
        </div>

        <div className="-mx-4 lg:-mx-10 px-4 lg:px-10 mb-4 overflow-x-auto scrollbar-none">
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


        {tab === "info" && <InfoTab customer={customer} />}
        {tab === "repairs" && <RepairsTab repairs={repairs} />}
        {tab === "warranty" && <WarrantyTab warranties={warranties} repairs={repairs} />}
        {tab === "crm" && <CrmTab customer={customer} />}
      </div>
    </div>
  );
}

function InfoTab({ customer }: { customer: Customer }) {
  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-3">
      <KV k="ชื่อ-สกุล" v={customer.name} />
      <KV k="โทรศัพท์" v={customer.phone} />
      {customer.lineId && <KV k="LINE ID" v={customer.lineId} />}
      <KV k="จำนวนครั้งที่ใช้บริการ" v={`${customer.visits} ครั้ง`} />
      <KV k="ยอดรวม" v={<span className="text-brand font-bold tabular-nums">{fmtBaht(customer.totalSpent)}</span>} />
      <KV k="เข้าใช้บริการล่าสุด" v={customer.lastVisit} />
    </div>
  );
}

type RepairFilter = "all" | "repairing" | "waiting_parts" | "completed" | "received";

const REPAIR_FILTERS: Array<{ key: RepairFilter; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "repairing", label: "กำลังซ่อม" },
  { key: "waiting_parts", label: "รออะไหล่" },
  { key: "completed", label: "ซ่อมเสร็จ" },
  { key: "received", label: "รับเครื่องแล้ว" },
];

function RepairsTab({ repairs }: { repairs: Repair[] }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<RepairFilter>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return repairs.filter((r) => {
      if (f !== "all" && r.status !== (f as RepairStatus)) return false;
      if (!needle) return true;
      return (
        r.id.toLowerCase().includes(needle) ||
        `${r.brand} ${r.model}`.toLowerCase().includes(needle) ||
        r.problem.toLowerCase().includes(needle)
      );
    });
  }, [repairs, q, f]);

  if (repairs.length === 0)
    return <p className="text-sm text-muted-foreground text-center py-12">ยังไม่มีประวัติการซ่อม</p>;

  return (
    <div>
      <div className="space-y-2.5 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาประวัติซ่อม รุ่นเครื่อง / อาการเสีย / เลขงาน"
            className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none pl-10 pr-4 h-11 text-sm"
          />
        </div>
        <div className="-mx-4 lg:-mx-10 px-4 lg:px-10 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 py-1 w-max">
            {REPAIR_FILTERS.map((opt) => (
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
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">ไม่พบประวัติที่ตรงกับเงื่อนไข</p>
      ) : (
        <div className="space-y-5">
          {groupByImei(filtered).map((g) => (
            <div key={g.imei}>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {g.brand} {g.model} <span className="font-mono normal-case text-[10px]">· IMEI …{g.imei.slice(-4)}</span>
                </p>
                <span className="text-[10px] text-muted-foreground">{g.items.length} งาน</span>
              </div>
              <div className="space-y-2">
                {g.items.map((r) => (
                  <Link
                    key={r.id}
                    to="/repairs/$id"
                    params={{ id: r.id }}
                    className="flex items-center justify-between gap-3 bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-4 hover:ring-brand/30"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-muted-foreground">#{r.id} · {r.createdAt.slice(0, 10)}</p>
                      <p className="text-sm font-medium truncate">{r.problem}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={r.status} />
                      <span className="text-xs tabular-nums">{fmtBaht(r.estimatedPrice)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByImei(list: Repair[]): Array<{ imei: string; brand: string; model: string; items: Repair[] }> {
  const map = new Map<string, { imei: string; brand: string; model: string; items: Repair[] }>();
  for (const r of list) {
    const key = r.imei || `${r.brand}-${r.model}`;
    const cur = map.get(key);
    if (cur) cur.items.push(r);
    else map.set(key, { imei: r.imei || "—", brand: r.brand, model: r.model, items: [r] });
  }
  return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
}

function WarrantyTab({ warranties }: { warranties: Warranty[]; repairs: Repair[] }) {
  if (warranties.length === 0)
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <ShieldCheck className="size-8 mx-auto mb-2 opacity-30" />
        ยังไม่มีรายการรับประกัน
      </div>
    );
  return (
    <div className="space-y-3">
      {warranties.map((w) => (
        <WarrantyCard key={w.id} w={w} />
      ))}
    </div>
  );
}

function CrmTab({ customer }: { customer: Customer }) {
  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">บันทึก CRM</h2>
      <textarea
        defaultValue={customer.note ?? ""}
        placeholder="เพิ่มบันทึกสำหรับลูกค้ารายนี้..."
        rows={5}
        className="w-full rounded-lg bg-muted ring-1 ring-border focus:ring-brand outline-none px-3 py-2 text-sm resize-none"
      />
      {customer.totalSpent > 15000 && (
        <div className="mt-3 rounded-lg bg-brand/5 ring-1 ring-brand/20 p-3 flex items-start gap-2">
          <Sparkles className="size-4 text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">ลูกค้า VIP — แนะนำให้ส่วนลด 10% ในงานครั้งถัดไป</p>
        </div>
      )}
    </div>
  );
}

function KV({ k, v, small }: { k: string; v: React.ReactNode; small?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center gap-2", small ? "text-xs" : "text-sm")}>
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
