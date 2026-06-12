import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Save, Trash2, History, SlidersHorizontal } from "lucide-react";
import { updatePart, deletePart } from "@/mocks/parts-store";
import { addLocation } from "@/mocks/locations-store";
import type { Part } from "@/mocks/types";
import { StockHistoryList } from "./stock-history-list";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import {
  PartFormFields,
  partToForm,
  validatePartForm,
  formToPart,
  type PartFormValues,
  type FieldErrors,
} from "./part-form";

export function EditPartDialog({
  part,
  open,
  onOpenChange,
}: {
  part: Part | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [f, setF] = useState<PartFormValues | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [tab, setTab] = useState<"info" | "history">("info");

  useEffect(() => {
    if (open && part) {
      setF(partToForm(part));
      setErrors({});
      setConfirmDel(false);
      setTab("info");
    }
  }, [open, part]);

  if (!part || !f) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePartForm(f, part.id);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0] ?? "กรุณาตรวจสอบข้อมูล");
      return;
    }
    updatePart(part.id, formToPart(f));
    if (f.location.trim()) addLocation(f.location.trim());
    toast.success(`อัปเดต "${f.name}" แล้ว`);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!confirmDel) {
      setConfirmDel(true);
      return;
    }
    deletePart(part.id);
    toast.success(`ลบ "${part.name}" แล้ว`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-0"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
      >
        <div className="px-5 pt-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-brand" /> แก้ไขอะไหล่
            </DialogTitle>
            <DialogDescription className="text-xs">
              SKU จะอัปเดตอัตโนมัติเมื่อเปลี่ยนหมวด/รุ่น (แก้เองได้)
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-5 pt-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "info" | "history")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="info">ข้อมูล</TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="size-3.5" /> ประวัติสต็อก
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="mt-3">
              <form onSubmit={submit} className="space-y-3">
                <PartFormFields value={f} onChange={setF} errors={errors} excludeId={part.id} />

                <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 bg-background space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="flex-1 rounded-lg bg-card ring-1 ring-border min-h-[44px] text-sm font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-brand text-brand-foreground min-h-[44px] text-sm font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <Save className="size-4" /> บันทึก
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={
                      "w-full rounded-lg min-h-[40px] text-xs font-semibold inline-flex items-center justify-center gap-2 ring-1 transition-colors " +
                      (confirmDel
                        ? "bg-critical text-white ring-critical"
                        : "bg-card text-critical ring-critical/30 hover:bg-critical/5")
                    }
                  >
                    <Trash2 className="size-3.5" /> {confirmDel ? "ยืนยันลบ — กดอีกครั้ง" : "ลบอะไหล่นี้"}
                  </button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="history" className="mt-3 space-y-3 pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  คงเหลือปัจจุบัน <span className="font-semibold text-foreground">{part.stock}</span> ชิ้น
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 min-h-[36px] text-xs font-semibold"
                >
                  <SlidersHorizontal className="size-3.5" /> ปรับสต็อก
                </button>
              </div>
              <StockHistoryList partId={part.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      <AdjustStockDialog part={part} open={adjustOpen} onOpenChange={setAdjustOpen} defaultMode="in" />
    </Dialog>
  );
}
