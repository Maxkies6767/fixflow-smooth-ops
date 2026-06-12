import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, QrCode, Plus, Box, PackagePlus, Pencil, Printer, X, AlertTriangle, TrendingUp, Wallet, SlidersHorizontal, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, SectionHeader } from "@/components/fixflow/section";
import { AddPartDialog } from "@/components/fixflow/add-part-dialog";
import { EditPartDialog } from "@/components/fixflow/edit-part-dialog";
import { AdjustStockDialog } from "@/components/fixflow/adjust-stock-dialog";
import { BarcodeSvg, QrSvg } from "@/components/fixflow/part-codes";
import { usePartsList } from "@/mocks/parts-store";
import { useVariantOptions, VARIANT_LABEL, hasVariant } from "@/mocks/variants-store";
import { fmtBaht } from "@/mocks";
import { CATEGORY_LABEL, type PartCategory, type Part } from "@/mocks/types";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/inventory/")({
  head: () => ({ meta: [{ title: "สต็อกอะไหล่ · FIXFLOW" }, { name: "description", content: "จัดการสต็อกอะไหล่มือถือ" }] }),
  component: InventoryListPage,
});

const TABS: Array<{ key: "all" | PartCategory; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  ...((["screens", "batteries", "ports", "ics", "cameras", "charging_flex", "back_glass", "switches", "adhesive"] as PartCategory[]).map((k) => ({ key: k, label: CATEGORY_LABEL[k] }))),
];


function InventoryListPage() {
  const [cat, setCat] = useState<"all" | PartCategory>("all");
  const [variantFilter, setVariantFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [codePart, setCodePart] = useState<Part | null>(null);
  const [adjustPart, setAdjustPart] = useState<Part | null>(null);
  const allList = usePartsList();
  const editingPart = useMemo(() => allList.find((p) => p.id === editingId) ?? null, [allList, editingId]);
  const showVariantFilter = cat !== "all" && hasVariant(cat as PartCategory);
  const variantOptions = useVariantOptions(showVariantFilter ? (cat as PartCategory) : ("screens" as PartCategory));

  const lowCount = allList.filter((p) => p.stock <= p.minStock).length;
  const totals = useMemo(() => {
    let value = 0;
    let cost = 0;
    for (const p of allList) {
      value += p.price * p.stock;
      cost += p.cost * p.stock;
    }
    return { value, cost, profit: value - cost };
  }, [allList]);

  const parts = allList.filter((p) => {
    const okCat = cat === "all" || p.category === cat;
    const okVar = !showVariantFilter || !variantFilter || p.variant === variantFilter;
    const okLow = !onlyLow || p.stock <= p.minStock;
    const okQ = !q || (p.name + " " + p.sku + " " + (p.model ?? "") + " " + (p.variant ?? "") + " " + p.compatible.join(" ")).toLowerCase().includes(q.toLowerCase());
    return okCat && okVar && okLow && okQ;
  });


  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto">
      <PageHeader
        title="สต็อกอะไหล่"
        subtitle={`${allList.length} รายการ · ใกล้หมด ${allList.filter((p) => p.stock <= p.minStock).length}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 py-2 text-xs lg:text-sm font-semibold min-h-[40px] lg:min-h-[44px] lg:px-4"
            >
              <PackagePlus className="size-3.5 lg:size-4" /> เพิ่มอะไหล่
            </button>
            <Link
              to="/inventory/history"
              className="inline-flex items-center gap-1.5 rounded-lg bg-card ring-1 ring-border px-3 py-2 text-xs lg:text-sm font-semibold min-h-[40px] lg:min-h-[44px] lg:px-4 hover:bg-muted"
            >
              <History className="size-3.5 lg:size-4" /> ประวัติ
            </Link>
            <Link to="/inventory/scan" className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold min-h-[44px]">
              <QrCode className="size-4" /> สแกน QR
            </Link>
          </div>
        }
      />

      <AddPartDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditPartDialog
        part={editingPart}
        open={!!editingId}
        onOpenChange={(v) => !v && setEditingId(null)}
      />
      <AdjustStockDialog
        part={adjustPart}
        open={!!adjustPart}
        onOpenChange={(v) => !v && setAdjustPart(null)}
        defaultMode="in"
      />

      {/* Summary: stock value / cost / profit */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <SummaryCard label="มูลค่าสต็อก" value={fmtBaht(totals.value)} icon={Wallet} />
        <SummaryCard label="ต้นทุนรวม" value={fmtBaht(totals.cost)} icon={Box} />
        <SummaryCard label="กำไรคาดการณ์" value={fmtBaht(totals.profit)} icon={TrendingUp} accent />
      </div>

      {/* Low-stock banner */}
      {lowCount > 0 && (
        <button
          onClick={() => setOnlyLow((v) => !v)}
          className={cn(
            "w-full mb-4 rounded-xl px-4 py-3 flex items-center gap-3 ring-1 transition-colors text-left",
            onlyLow
              ? "bg-warning text-white ring-warning"
              : "bg-warning/10 text-warning ring-warning/30 hover:bg-warning/15",
          )}
        >
          <AlertTriangle className="size-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              มีอะไหล่ต่ำกว่าจุดสั่งซื้อ {lowCount} รายการ
            </p>
            <p className={cn("text-[11px]", onlyLow ? "text-white/80" : "opacity-80")}>
              {onlyLow ? "กดอีกครั้งเพื่อแสดงทั้งหมด" : "กดเพื่อกรองเฉพาะรายการที่ต้องสั่งเพิ่ม"}
            </p>
          </div>
          <span className="text-xs font-semibold shrink-0">
            {onlyLow ? "ล้างตัวกรอง" : "กรอง →"}
          </span>
        </button>
      )}


      {/* Search + scan FAB */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาชื่ออะไหล่ / SKU / รุ่นที่ใช้ได้"
            className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none pl-10 pr-4 h-12 text-[15px]"
          />
        </div>
        <Link to="/inventory/scan" className="lg:hidden size-12 grid place-items-center rounded-xl bg-foreground text-background">
          <QrCode className="size-5" />
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 pb-2 mb-4">

        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setCat(t.key); setVariantFilter(""); }}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors",
              cat === t.key
                ? "bg-foreground text-background ring-foreground"
                : "bg-card text-muted-foreground ring-border hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showVariantFilter && variantOptions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          <span className="shrink-0 self-center text-[11px] text-muted-foreground pr-1">
            {VARIANT_LABEL[cat as PartCategory]}:
          </span>
          <button
            onClick={() => setVariantFilter("")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
              variantFilter === ""
                ? "bg-brand text-brand-foreground ring-brand"
                : "bg-card text-muted-foreground ring-border hover:text-foreground",
            )}
          >
            ทั้งหมด
          </button>
          {variantOptions.map((v) => (
            <button
              key={v}
              onClick={() => setVariantFilter(v === variantFilter ? "" : v)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
                variantFilter === v
                  ? "bg-brand text-brand-foreground ring-brand"
                  : "bg-card text-muted-foreground ring-border hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}




      {/* Parts list */}
      <SectionHeader label={`${parts.length} รายการ`} />
      <div className="grid sm:grid-cols-2 gap-3">
        {parts.map((p) => {
          const isOut = p.stock === 0;
          const isLow = p.stock > 0 && p.stock <= p.minStock;
          return (
            <div key={p.id} className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-muted-foreground tracking-tighter">{p.sku}</p>
                  <h3 className="text-sm font-medium leading-tight">
                    {p.name}
                    {p.variant && (
                      <span className="ml-1.5 inline-block align-middle text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand ring-1 ring-brand/30">
                        {p.variant}
                      </span>
                    )}
                  </h3>

                  {p.model && (
                    <p className="text-[11px] font-semibold text-brand mt-0.5 truncate">รุ่น: {p.model}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">ใช้ได้กับ: {p.compatible.join(", ")}</p>
                </div>
                {isOut ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-critical text-white whitespace-nowrap">หมด</span>
                ) : isLow ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning ring-1 ring-warning/30 whitespace-nowrap">ใกล้หมด</span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success ring-1 ring-success/30 whitespace-nowrap">พร้อมขาย</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="คงเหลือ" value={`${p.stock} ชิ้น`} />
                <Stat label="ขั้นต่ำ" value={`${p.minStock} ชิ้น`} />
                <Stat label="ตำแหน่ง" value={p.location} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                <div className="text-xs min-w-0">
                  <span className="text-muted-foreground">ราคาขาย </span>
                  <span className="font-semibold tabular-nums">{fmtBaht(p.price)}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setCodePart(p)}
                    aria-label="ดู Barcode / QR"
                    className="inline-flex items-center gap-1 min-h-[36px] px-2 rounded-lg text-xs font-semibold text-foreground bg-muted hover:bg-accent"
                  >
                    <QrCode className="size-3" />
                  </button>
                  <button
                    onClick={() => setEditingId(p.id)}
                    className="inline-flex items-center gap-1 min-h-[36px] px-2 rounded-lg text-xs font-semibold text-foreground bg-muted hover:bg-accent"
                  >
                    <Pencil className="size-3" /> แก้ไข
                  </button>
                  <button
                    onClick={() => setAdjustPart(p)}
                    className="inline-flex items-center gap-1 min-h-[36px] px-2 rounded-lg text-xs font-semibold text-brand hover:bg-brand/5"
                  >
                    <SlidersHorizontal className="size-3" /> ปรับ
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CodeDialog part={codePart} onOpenChange={(v) => !v && setCodePart(null)} />
    </div>
  );
}

function CodeDialog({ part, onOpenChange }: { part: Part | null; onOpenChange: (v: boolean) => void }) {
  const variantLabel = part?.variant ? (VARIANT_LABEL[part.category] ?? "ตัวเลือก") : "";
  // QR payload: multi-line so a phone scanner reads sku + รุ่น + variant
  const qrPayload = part
    ? [
        part.sku,
        part.name,
        part.model ? `รุ่น: ${part.model}` : "",
        part.variant ? `${variantLabel}: ${part.variant}` : "",
        `ตำแหน่ง: ${part.location}`,
      ].filter(Boolean).join("\n")
    : "";
  return (
    <Dialog open={!!part} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm p-0 overflow-hidden">
        {part && (
          <>
            <DialogHeader className="px-5 pt-5">
              <DialogTitle className="text-base flex items-center gap-2">
                <QrCode className="size-4 text-brand" /> {part.sku}
              </DialogTitle>
            </DialogHeader>
            <div id="print-area" className="px-5 pt-3 pb-5 flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-center">{part.name}</p>
              <div className="text-xs text-muted-foreground text-center space-y-0.5">
                {part.model && <p>รุ่น: <span className="font-semibold text-foreground">{part.model}</span></p>}
                {part.variant && (
                  <p>
                    {variantLabel}:{" "}
                    <span className="font-semibold text-brand">{part.variant}</span>
                  </p>
                )}
                <p>หมวด: {CATEGORY_LABEL[part.category]}</p>
              </div>
              <QrSvg value={qrPayload} size={180} />
              <div className="w-full">
                <BarcodeSvg value={part.sku} height={70} />
              </div>
              <p className="text-[11px] text-muted-foreground">ตำแหน่ง: {part.location} · ราคา {fmtBaht(part.price)}</p>
            </div>
            <div className="px-5 pb-5 flex gap-2 no-print">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-lg bg-card ring-1 ring-border min-h-[44px] text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                <X className="size-4" /> ปิด
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-lg bg-brand text-brand-foreground min-h-[44px] text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Printer className="size-4" /> ปริ้น
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  accent?: boolean;
}) {
  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className="size-3.5" />
        <span className="text-[10px] leading-tight">{label}</span>
      </div>
      <p className={cn("text-sm lg:text-base font-semibold tabular-nums leading-tight", accent && "text-success")}>
        {value}
      </p>
    </div>
  );
}
