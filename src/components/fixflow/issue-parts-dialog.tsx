import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Wrench, Minus, Plus, AlertTriangle } from "lucide-react";
import { usePartsList } from "@/mocks/parts-store";
import { addPartToRepair } from "@/mocks/repairs-store";
import { fmtBaht } from "@/mocks";
import type { Part } from "@/mocks/types";
import { cn } from "@/lib/utils";

export function IssuePartsDialog({
  repairId,
  deviceBrand,
  deviceModel,
  open,
  onOpenChange,
}: {
  repairId: string;
  deviceBrand?: string;
  deviceModel?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const parts = usePartsList();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Part | null>(null);
  const [qty, setQty] = useState(1);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (open) {
      setQ("");
      setPicked(null);
      setQty(1);
      setShowAll(false);
    }
  }, [open]);

  const matchesDevice = (p: Part) => {
    if (!deviceModel) return true;
    const m = deviceModel.toLowerCase();
    const b = (deviceBrand ?? "").toLowerCase();
    return (p.compatible ?? []).some((c) => {
      const cc = c.toLowerCase();
      return cc === m || cc.includes(m) || m.includes(cc) || (b && cc.includes(b) && cc.includes(m.split(" ")[0] ?? ""));
    });
  };

  const hasDeviceFilter = !!deviceModel && !showAll && !q.trim();
  const matchedForDevice = useMemo(
    () => (deviceModel ? parts.filter(matchesDevice) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parts, deviceModel, deviceBrand],
  );

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = hasDeviceFilter ? matchedForDevice : parts;
    const filtered = query
      ? base.filter(
          (p) =>
            p.sku.toLowerCase().includes(query) ||
            p.name.toLowerCase().includes(query) ||
            (p.variant ?? "").toLowerCase().includes(query),
        )
      : base;
    // sort: matches device first, in stock first, then by name
    return [...filtered]
      .sort((a, b) => {
        const am = matchesDevice(a) ? 0 : 1;
        const bm = matchesDevice(b) ? 0 : 1;
        if (am !== bm) return am - bm;
        const as = a.stock > 0 ? 0 : 1;
        const bs = b.stock > 0 ? 0 : 1;
        if (as !== bs) return as - bs;
        return a.name.localeCompare(b.name);
      })
      .slice(0, query ? 12 : 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, q, hasDeviceFilter, matchedForDevice]);

  const shortage = picked ? Math.max(0, qty - picked.stock) : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked) {
      toast.error("กรุณาเลือกอะไหล่");
      return;
    }
    if (qty < 1) {
      toast.error("จำนวนต้องมากกว่า 0");
      return;
    }
    const res = addPartToRepair(repairId, { partId: picked.id, qty });
    if (!res) {
      toast.error("เบิกไม่สำเร็จ");
      return;
    }
    if (res.shortage > 0 && res.issued === 0) {
      toast.warning(`สต็อกหมด — ตั้งสถานะเป็น "รออะไหล่"`);
    } else if (res.shortage > 0) {
      toast.warning(`เบิกได้ ${res.issued}/${res.requested} ชิ้น — ตั้งสถานะเป็น "รออะไหล่"`);
    } else {
      toast.success(`เบิก ${res.issued} ชิ้น เข้าใบงาน ${repairId}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-md p-0"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
      >
        <div className="px-5 pt-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="size-5 text-brand" /> เบิกอะไหล่เข้าใบงาน
            </DialogTitle>
            <DialogDescription className="text-xs">
              ใบงาน <span className="font-mono">{repairId}</span> — ตัดสต็อก + บันทึกประวัติอัตโนมัติ
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit} className="px-5 pt-3 pb-1 space-y-3">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPicked(null);
              }}
              placeholder="ค้นหา SKU / ชื่ออะไหล่"
              className="w-full h-11 pl-10 pr-3 rounded-lg bg-card ring-1 ring-border outline-none focus:ring-brand text-sm"
            />
          </div>

          {!picked && deviceModel && (
            <div className="flex items-center justify-between gap-2 text-[11px]">
              {hasDeviceFilter ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2 py-0.5 font-semibold">
                    🎯 กรองตามรุ่น: {deviceModel}
                  </span>
                  <button type="button" onClick={() => setShowAll(true)} className="text-brand font-semibold">
                    ดูทั้งหมด
                  </button>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">แสดงอะไหล่ทั้งหมด</span>
                  {!q.trim() && (
                    <button type="button" onClick={() => setShowAll(false)} className="text-brand font-semibold">
                      กรองตามรุ่นอีกครั้ง
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {!picked ? (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {suggestions.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {hasDeviceFilter ? `ไม่มีอะไหล่สำหรับ ${deviceModel} ในสต็อก` : "ไม่พบรายการ"}
                  </p>
                  {hasDeviceFilter && (
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="text-[11px] text-brand font-semibold"
                    >
                      ดูอะไหล่ทั้งหมด
                    </button>
                  )}
                </div>
              ) : (
                suggestions.map((p) => {
                  const isMatch = matchesDevice(p);
                  return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPicked(p);
                      setQty(1);
                    }}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg ring-1 bg-background hover:bg-muted",
                      isMatch && deviceModel ? "ring-brand/40" : "ring-border",
                      p.stock === 0 && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-muted-foreground">{p.sku}</p>
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        {isMatch && deviceModel && !hasDeviceFilter && (
                          <p className="text-[10px] text-brand font-semibold mt-0.5">✓ ตรงรุ่น</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold",
                          p.stock === 0
                            ? "bg-destructive/10 text-destructive"
                            : p.stock <= p.minStock
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success",
                        )}
                      >
                        เหลือ {p.stock}
                      </span>
                    </div>
                  </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-card ring-1 ring-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-muted-foreground">{picked.sku}</p>
                    <p className="text-sm font-semibold truncate">{picked.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      คงเหลือ {picked.stock} · ราคา {fmtBaht(picked.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPicked(null)}
                    className="text-[11px] text-brand font-semibold shrink-0"
                  >
                    เปลี่ยน
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground">จำนวนที่เบิก</label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="size-11 rounded-lg bg-card ring-1 ring-border grid place-items-center"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 h-11 text-center text-lg font-semibold tabular-nums rounded-lg bg-card ring-1 ring-border outline-none focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="size-11 rounded-lg bg-card ring-1 ring-border grid place-items-center"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                {shortage > 0 && (
                  <div className="mt-2 flex items-start gap-2 text-[11px] text-warning bg-warning/10 ring-1 ring-warning/20 rounded-lg p-2">
                    <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                    <span>
                      สต็อกไม่พอ — เบิกได้ {picked.stock}/{qty} จะเปลี่ยนสถานะใบงานเป็น "รออะไหล่" อัตโนมัติ
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg bg-card ring-1 ring-border min-h-[44px] text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!picked}
              className="flex-1 rounded-lg bg-brand text-brand-foreground min-h-[44px] text-sm font-semibold disabled:opacity-50"
            >
              เบิก
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
