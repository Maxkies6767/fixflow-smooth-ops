import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { addCustomer } from "@/mocks/customers-store";

export function CustomerAddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const p = phone.trim();
    if (!n || !p) {
      toast.error("กรุณากรอกชื่อและเบอร์โทร");
      return;
    }
    if (!/^[0-9+\-\s()]{6,20}$/.test(p)) {
      toast.error("เบอร์โทรไม่ถูกต้อง");
      return;
    }
    addCustomer({ name: n, phone: p, lineId: lineId.trim() || undefined });
    toast.success(`เพิ่มลูกค้า ${n} แล้ว`);
    setName(""); setPhone(""); setLineId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-brand" /> เพิ่มลูกค้าใหม่
          </DialogTitle>
          <DialogDescription className="text-xs">
            บันทึกในเครื่องนี้
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="ชื่อลูกค้า *" value={name} onChange={setName} placeholder="คุณ..." />
          <Field label="เบอร์โทรศัพท์ *" value={phone} onChange={setPhone} placeholder="08X-XXX-XXXX" type="tel" />
          <Field label="LINE ID" value={lineId} onChange={setLineId} placeholder="@lineid" />
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

function Field({
  label, value, onChange, ...rest
}: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px]"
      />
    </label>
  );
}
