import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { createWarrantyForRepair } from "@/mocks/warranty-store";
import type { Repair } from "@/mocks/types";

export function WarrantyRegisterDialog({
  repair,
  open,
  onOpenChange,
}: {
  repair: Repair;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const defaultParts =
    repair.partsUsed.map((p) => p.name).join(", ") || "งานซ่อมทั่วไป";

  const [days, setDays] = useState<number>(repair.warrantyDays || 90);
  const [partName, setPartName] = useState<string>(defaultParts);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (open) {
      setDays(repair.warrantyDays || 90);
      setPartName(defaultParts);
      setNote("");
    }
  }, [open, repair.id, repair.warrantyDays, defaultParts]);

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (Number.isFinite(days) ? days : 0));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) {
      toast.error("กรุณาระบุชิ้นส่วน/บริการที่รับประกัน");
      return;
    }
    if (days < 1) {
      toast.error("จำนวนวันต้องมากกว่า 0");
      return;
    }
    const w = createWarrantyForRepair({
      repair,
      days,
      partName: partName.trim(),
      claimNote: note.trim() || undefined,
    });
    toast.success(`ลงทะเบียนรับประกันแล้ว · ${w.id}`);
    onOpenChange(false);
    navigate({ to: "/warranty/$id", params: { id: w.id } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-600" />
            ลงทะเบียนรับประกัน
          </DialogTitle>
          <DialogDescription>
            งาน #{repair.id} · {repair.customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              ชิ้นส่วน / บริการที่รับประกัน
            </label>
            <input
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="w-full rounded-lg ring-1 ring-border bg-background px-3 h-10 text-sm focus:outline-none focus:ring-brand"
              placeholder="เช่น หน้าจอ, แบตเตอรี่"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              ระยะเวลา (วัน)
            </label>
            <div className="flex gap-2">
              {[30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`flex-1 rounded-lg ring-1 h-9 text-sm font-medium transition-colors ${
                    days === d
                      ? "bg-foreground text-background ring-foreground"
                      : "bg-card ring-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value || "0", 10))}
              className="w-full rounded-lg ring-1 ring-border bg-background px-3 h-10 text-sm tabular-nums"
            />
          </div>

          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex justify-between">
            <span>
              เริ่ม{" "}
              <span className="text-foreground font-medium">
                {today.toLocaleDateString("th-TH")}
              </span>
            </span>
            <span>
              หมดอายุ{" "}
              <span className="text-foreground font-medium">
                {endDate.toLocaleDateString("th-TH")}
              </span>
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg ring-1 ring-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-brand resize-none"
              placeholder="เงื่อนไขเพิ่มเติม..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-lg ring-1 ring-border text-sm font-medium hover:bg-muted"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-lg bg-brand text-brand-foreground text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="size-4" /> ยืนยัน
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
