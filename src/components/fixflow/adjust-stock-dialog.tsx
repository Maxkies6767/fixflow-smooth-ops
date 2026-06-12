import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, SlidersHorizontal, Wrench } from "lucide-react";
import { adjustStock } from "@/mocks/parts-store";
import { attachIssuedPartToRepair, useRepairsList } from "@/mocks/repairs-store";

import type { Part } from "@/mocks/types";
import { cn } from "@/lib/utils";

type Mode = "in" | "out" | "adjust";

export function AdjustStockDialog({
  part,
  open,
  onOpenChange,
  defaultMode = "in",
}: {
  part: Part | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState("");
  const [repairId, setRepairId] = useState<string>("");

  const repairs = useRepairsList();
  const openRepairs = useMemo(
    () =>
      repairs.filter(
        (r) => !["completed", "picked_up", "canceled"].includes(r.status as string),
      ),
    [repairs],
  );

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setQty(1);
      setNote("");
      setRepairId("");
    }
  }, [open, defaultMode]);

  if (!part) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.abs(qty || 0);
    if (n === 0) {
      toast.error("จำนวนต้องมากกว่า 0");
      return;
    }
    const delta = mode === "out" ? -n : mode === "in" ? n : qty; // adjust uses signed value
    if (mode === "out" && n > part.stock) {
      toast.error(`สต็อกไม่พอ (เหลือ ${part.stock})`);
      return;
    }
    if (mode === "adjust" && !note.trim()) {
      toast.error("กรุณาระบุเหตุผลการปรับสต็อก");
      return;
    }
    const next = adjustStock(part.id, delta, {
      type: mode,
      note: note.trim() || undefined,
      refRepairId: repairId || undefined,
    });
    // Mirror "out" into the linked repair's partsUsed (the dialog's caller has
    // already touched stock above, so we don't re-deduct here).
    if (mode === "out" && repairId) {
      attachIssuedPartToRepair(repairId, { partId: part.id, qty: n });
    }
    toast.success(
      mode === "in"
        ? `เติม ${n} ชิ้น → คงเหลือ ${next}`
        : mode === "out"
          ? `เบิก ${n} ชิ้น → คงเหลือ ${next}${repairId ? ` (${repairId})` : ""}`
          : `ปรับสต็อก → คงเหลือ ${next}`,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-sm p-0"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
      >
        <div className="px-5 pt-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-brand" /> ปรับสต็อก
            </DialogTitle>
            <DialogDescription className="text-xs">
              {part.name} · คงเหลือ <span className="font-semibold text-foreground">{part.stock}</span>
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={submit} className="px-5 pt-3 pb-1 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {(["in", "out", "adjust"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-lg min-h-[40px] text-xs font-semibold ring-1 transition-colors",
                  mode === m
                    ? "bg-brand text-brand-foreground ring-brand"
                    : "bg-card text-muted-foreground ring-border hover:text-foreground",
                )}
              >
                {m === "in" ? "เติมเข้า" : m === "out" ? "เบิกออก" : "ปรับ"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground">
              จำนวน {mode === "adjust" ? "(+/-)" : ""}
            </label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setQty((q) => q - 1)}
                className="size-11 rounded-lg bg-card ring-1 ring-border grid place-items-center"
              >
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
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
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Wrench className="size-3" /> ผูกกับใบงาน (ถ้ามี)
            </label>
            <select
              value={repairId}
              onChange={(e) => setRepairId(e.target.value)}
              className="mt-1 w-full h-11 rounded-lg bg-card ring-1 ring-border outline-none focus:ring-brand px-3 text-sm"
            >
              <option value="">— ไม่ผูก —</option>
              {openRepairs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {r.customerName} · {r.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>
                เหตุผล / โน้ต
                {mode === "adjust" && <span className="text-destructive"> *</span>}
              </span>
              {note && <span className="text-[10px] text-success">บันทึกลงประวัติ ✓</span>}
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === "in"
                  ? "เช่น PO #1234, รับจากซัพ"
                  : mode === "out"
                    ? "เช่น เบิกใช้งาน, ของแถม"
                    : "ระบุเหตุผลการปรับ (จำเป็น)"
              }
              className="mt-1 w-full h-11 rounded-lg bg-card ring-1 ring-border outline-none focus:ring-brand px-3 text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(mode === "in"
                ? ["รับจากซัพ", "PO เข้าใหม่", "คืนของจากลูกค้า"]
                : mode === "out"
                  ? ["เบิกใช้งาน", "ของแถม", "เคลม/ส่งคืน"]
                : ["นับสต็อกใหม่", "ของสูญหาย", "แก้ไขข้อมูล"]
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNote(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground ring-1 ring-border"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>



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
              className="flex-1 rounded-lg bg-brand text-brand-foreground min-h-[44px] text-sm font-semibold"
            >
              บันทึก
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
