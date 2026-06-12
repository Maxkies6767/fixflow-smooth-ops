import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
import { addPart, getAllParts } from "@/mocks/parts-store";
import { addLocation, seedLocations } from "@/mocks/locations-store";
import {
  PartFormFields,
  emptyForm,
  validatePartForm,
  formToPart,
  type PartFormValues,
  type FieldErrors,
} from "./part-form";

export function AddPartDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [f, setF] = useState<PartFormValues>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setF(emptyForm);
      setErrors({});
      // Seed location store with locations from existing parts (only on first ever open)
      seedLocations(getAllParts().map((p) => p.location));
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePartForm(f);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0] ?? "กรุณาตรวจสอบข้อมูล");
      return;
    }
    const created = addPart(formToPart(f));
    if (f.location.trim()) addLocation(f.location.trim());
    toast.success(`เพิ่มอะไหล่ "${created.name}" แล้ว`);
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
              <PackagePlus className="size-5 text-brand" /> เพิ่มอะไหล่ใหม่
            </DialogTitle>
            <DialogDescription className="text-xs">
              SKU + Barcode/QR สร้างให้อัตโนมัติ · เลือกรุ่นจากคลังได้
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={submit} className="px-5 pt-3 space-y-3">
          <PartFormFields value={f} onChange={setF} errors={errors} />

          <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 bg-background flex gap-2">
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
              <PackagePlus className="size-4" /> บันทึกอะไหล่
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
