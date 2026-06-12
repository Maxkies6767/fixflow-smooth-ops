import { useState } from "react";
import { toast } from "sonner";
import { Send, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { claimWarranty } from "@/mocks/warranty-store";
import type { Warranty } from "@/mocks/types";

export function QuickClaimDialog({
  w,
  children,
}: {
  w: Warranty;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const submit = () => {
    if (!note.trim()) {
      toast.error("กรุณาระบุอาการ");
      return;
    }
    claimWarranty(w.id, note.trim());
    toast.success(`เปิดเคลมประกัน ${w.id} สำเร็จ`);
    setOpen(false);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            เคลมประกันด่วน · {w.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <p><span className="text-muted-foreground">เครื่อง:</span> {w.device}</p>
            <p><span className="text-muted-foreground">ลูกค้า:</span> {w.customerName} · {w.phone}</p>
            <p><span className="text-muted-foreground">คุ้มครอง:</span> {w.partName}</p>
            <p><span className="text-muted-foreground">หมดอายุ:</span> {w.endDate}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">อาการที่พบ *</label>
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="เช่น หน้าจอเป็นเส้นหลังซ่อม 20 วัน"
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={submit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground font-semibold min-h-[44px]"
          >
            <Send className="size-4" /> ยืนยันเปิดเคลม
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
