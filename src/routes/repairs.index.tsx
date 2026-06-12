import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { PageHeader } from "@/components/fixflow/section";

import { RepairCard } from "@/components/fixflow/repair-card";
import { allRepairs } from "@/mocks";
import { STATUS_LABEL, type RepairStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/repairs/")({
  head: () => ({ meta: [{ title: "งานซ่อม · FIXFLOW" }, { name: "description", content: "รายการงานซ่อมทั้งหมดในร้าน FIXFLOW" }] }),
  component: RepairsListPage,
});

const FILTERS: Array<{ key: "all" | RepairStatus; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "received", label: STATUS_LABEL.received },
  { key: "diagnosing", label: STATUS_LABEL.diagnosing },
  { key: "waiting_parts", label: STATUS_LABEL.waiting_parts },
  { key: "repairing", label: STATUS_LABEL.repairing },
  { key: "completed", label: STATUS_LABEL.completed },
  { key: "picked_up", label: STATUS_LABEL.picked_up },
];

function RepairsListPage() {
  const [filter, setFilter] = useState<"all" | RepairStatus>("all");
  const [q, setQ] = useState("");
  const all = allRepairs();
  const filtered = all.filter((r) => {
    const okStatus = filter === "all" || r.status === filter;
    const okQ = !q || (r.customerName + r.model + r.id + r.phone).toLowerCase().includes(q.toLowerCase());
    return okStatus && okQ;
  });

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto">
      <PageHeader
        title="งานซ่อม"
        subtitle={`ทั้งหมด ${all.length} รายการ · เปิดอยู่ ${all.filter((r) => r.status !== "picked_up").length}`}
        actions={
          <Link to="/repairs/new" className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-4 py-2.5 text-sm font-semibold min-h-[44px]">
            <Plus className="size-4" /> รับเครื่องใหม่
          </Link>
        }
      />

      <div className="inline-flex rounded-lg bg-muted p-0.5 ring-1 ring-border mb-4">
        <span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-card ring-1 ring-border inline-flex items-center gap-1.5">
          <List className="size-3.5" /> รายการ
        </span>
        <Link to="/repairs/queue" className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5">
          <LayoutGrid className="size-3.5" /> คิว Kanban
        </Link>
      </div>


      {/* Search */}
      <div className="sticky top-0 z-20 -mx-4 lg:-mx-10 px-4 lg:px-10 pt-1 pb-3 bg-background/90 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา ID งานซ่อม / ชื่อลูกค้า / รุ่นเครื่อง"
            className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none pl-10 pr-12 h-12 text-[15px]"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 size-8 grid place-items-center rounded-lg hover:bg-muted">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors whitespace-nowrap",
                filter === f.key
                  ? "bg-foreground text-background ring-foreground"
                  : "bg-card text-muted-foreground ring-border hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">ไม่พบงานซ่อมที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          filtered.map((r) => <RepairCard key={r.id} repair={r} />)
        )}
      </div>
    </div>
  );
}
