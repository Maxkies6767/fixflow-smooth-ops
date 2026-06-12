import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Search, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, History, Filter } from "lucide-react";
import { useStockMovements, type StockMovementType } from "@/mocks/stock-movements-store";
import { usePartsList } from "@/mocks/parts-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory/history")({
  head: () => ({
    meta: [
      { title: "ประวัติสต็อกทั้งหมด · FIXFLOW" },
      { name: "description", content: "ประวัติการเข้า-ออก-ปรับสต็อกของทุก SKU พร้อมค้นหาและกรอง" },
    ],
  }),
  component: HistoryPage,
});

type Filter = "all" | StockMovementType;

const FILTER_LABEL: Record<Filter, string> = {
  all: "ทั้งหมด",
  in: "เติมเข้า",
  out: "เบิกออก",
  adjust: "ปรับ",
};

function HistoryPage() {
  const movements = useStockMovements();
  const parts = usePartsList();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const partsById = useMemo(() => {
    const m = new Map<string, (typeof parts)[number]>();
    for (const p of parts) m.set(p.id, p);
    return m;
  }, [parts]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return movements
      .filter((m) => (filter === "all" ? true : m.type === filter))
      .filter((m) => {
        if (!query) return true;
        const p = partsById.get(m.partId);
        const hay = [
          p?.sku,
          p?.name,
          p?.variant,
          m.note,
          m.refRepairId,
          m.by,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [movements, filter, q, partsById]);

  const totals = useMemo(() => {
    let inQty = 0;
    let outQty = 0;
    for (const m of filtered) {
      if (m.qty > 0) inQty += m.qty;
      else outQty += Math.abs(m.qty);
    }
    return { inQty, outQty, count: filtered.length };
  }, [filtered]);

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-10 py-3 flex items-center gap-2">
        <Link to="/inventory" className="size-9 grid place-items-center rounded-lg hover:bg-muted -ml-2">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Inventory</p>
          <h1 className="text-lg font-semibold truncate">ประวัติสต็อกทั้งหมด</h1>
        </div>
      </div>

      <div className="px-4 lg:px-10 py-6 max-w-3xl mx-auto space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card ring-1 ring-border p-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">รายการ</p>
            <p className="text-lg font-semibold tabular-nums">{totals.count}</p>
          </div>
          <div className="rounded-xl bg-card ring-1 ring-success/20 p-3">
            <p className="text-[10px] uppercase tracking-widest text-success">เข้า</p>
            <p className="text-lg font-semibold tabular-nums text-success">+{totals.inQty}</p>
          </div>
          <div className="rounded-xl bg-card ring-1 ring-warning/20 p-3">
            <p className="text-[10px] uppercase tracking-widest text-warning">ออก</p>
            <p className="text-lg font-semibold tabular-nums text-warning">-{totals.outQty}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา SKU, ชื่ออะไหล่, ใบงาน, โน้ต..."
            className="w-full h-11 pl-10 pr-3 rounded-lg bg-card ring-1 ring-border outline-none focus:ring-brand text-sm"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold ring-1 transition-colors",
                filter === f
                  ? "bg-foreground text-background ring-foreground"
                  : "bg-card text-muted-foreground ring-border hover:text-foreground",
              )}
            >
              {f === "all" && <Filter className="size-3" />}
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-muted/40 ring-1 ring-border p-10 text-center">
            <History className="size-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {movements.length === 0 ? "ยังไม่มีประวัติเข้า-ออกสต็อก" : "ไม่พบรายการตามเงื่อนไข"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((m) => {
              const part = partsById.get(m.partId);
              const isIn = m.qty > 0;
              const Icon = m.type === "in" ? ArrowDownToLine : m.type === "out" ? ArrowUpFromLine : SlidersHorizontal;
              const sign = m.qty > 0 ? "+" : "";
              return (
                <div key={m.id} className="flex items-center gap-3 bg-card ring-1 ring-border rounded-lg p-3">
                  <div className={cn(
                    "size-9 rounded-md grid place-items-center shrink-0",
                    isIn ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                  )}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {part?.name ?? <span className="text-muted-foreground italic">(ลบแล้ว)</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      <span className="font-mono">{part?.sku ?? m.partId}</span>
                      {m.note ? <> · {m.note}</> : null}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(m.at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })} · {m.by}
                      {m.refRepairId ? (
                        <>
                          {" · "}
                          <Link
                            to="/repairs/$id"
                            params={{ id: m.refRepairId }}
                            className="text-brand font-medium hover:underline"
                          >
                            ใบงาน {m.refRepairId}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-semibold tabular-nums",
                      isIn ? "text-success" : "text-warning",
                    )}>
                      {sign}{m.qty}
                    </p>
                    <p className="text-[10px] text-muted-foreground">เหลือ {m.stockAfter}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
