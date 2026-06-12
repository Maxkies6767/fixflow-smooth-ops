import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ShieldCheck, ShieldAlert, ShieldOff, ShieldQuestion, Camera, Send, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getWarrantyById, getRepairById } from "@/mocks";
import { useWarrantyById, claimWarranty, daysLeft } from "@/mocks/warranty-store";
import { WARRANTY_STATUS_LABEL, type Warranty } from "@/mocks/types";

export const Route = createFileRoute("/warranty/$id")({
  loader: ({ params }): Warranty => {
    const w = getWarrantyById(params.id);
    if (!w) throw notFound();
    return w;
  },
  head: ({ loaderData }: { loaderData?: Warranty }) => ({
    meta: [{ title: `รับประกัน ${loaderData?.id ?? ""} · FIXFLOW` }],
  }),
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">ไม่พบรายการรับประกันนี้</div>
  ),
  component: WarrantyDetailPage,
});

const ICON = { active: ShieldCheck, expiring: ShieldAlert, expired: ShieldOff, claimed: ShieldQuestion } as const;

function WarrantyDetailPage() {
  const initial = Route.useLoaderData() as Warranty;
  const live = useWarrantyById(initial.id);
  const w = live ?? initial;
  const repair = getRepairById(w.repairId);
  const [reason, setReason] = useState(w.claimNote ?? "");
  const Icon = ICON[w.status];

  const left = daysLeft(w.endDate);
  const pct = Math.min(100, Math.max(0, (left / w.days) * 100));
  const canClaim = w.status === "active" || w.status === "expiring";

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-10 py-3 flex items-center gap-3">
        <Link to="/warranty" className="size-9 grid place-items-center rounded-lg hover:bg-muted -ml-2">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-muted-foreground">#{w.id}</p>
          <h1 className="text-lg font-semibold truncate">{w.device}</h1>
        </div>
      </div>

      <div className="px-4 lg:px-10 py-6 max-w-3xl mx-auto space-y-5">
        <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-muted grid place-items-center shrink-0">
              <Icon className="size-6 text-brand" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{w.partName}</p>
              <p className="text-lg font-semibold">{WARRANTY_STATUS_LABEL[w.status]}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {w.startDate} → {w.endDate}
                {(w.status === "active" || w.status === "expiring") && ` · เหลือ ${left} วัน`}
              </p>
              {(w.status === "active" || w.status === "expiring") && (
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${w.status === "expiring" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">ข้อมูลลูกค้า</h2>
          <KV k="ชื่อ" v={w.customerName} />
          <KV k="เบอร์โทร" v={w.phone} />
          <KV k="งานซ่อมต้นทาง" v={
            <Link to="/repairs/$id" params={{ id: w.repairId }} className="text-brand font-semibold inline-flex items-center gap-1">
              #{w.repairId} <ExternalLink className="size-3" />
            </Link>
          } />
          {repair && <KV k="ราคาที่ซ่อม" v={`${repair.estimatedPrice.toLocaleString()} บาท`} />}
        </section>

        {w.status === "claimed" ? (
          <section className="bg-teal-50 dark:bg-teal-950/30 ring-1 ring-teal-500/20 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">บันทึกการเคลม</h2>
            <p className="text-sm">{w.claimNote}</p>
          </section>
        ) : canClaim ? (
          <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">แจ้งเคลมประกัน</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">รายละเอียดอาการที่พบ</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="เช่น หน้าจอเป็นเส้นภายใน 30 วันหลังซ่อม"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">รูปประกอบ (สูงสุด 3 รูป)</label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className="aspect-square rounded-lg bg-muted ring-1 ring-dashed ring-border grid place-items-center text-muted-foreground hover:text-foreground"
                  >
                    <Camera className="size-5" />
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (!reason.trim()) {
                  toast.error("กรุณาระบุรายละเอียดอาการ");
                  return;
                }
                claimWarranty(w.id, reason.trim());
                toast.success(`เปิดเคลม ${w.id} สำเร็จ — ใบรับประกันถูกบันทึกเป็น "เคลมแล้ว"`);
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground font-semibold min-h-[44px]"
            >
              <Send className="size-4" /> ส่งคำขอเคลม
            </button>
          </section>
        ) : (
          <section className="bg-zinc-100 dark:bg-zinc-900 ring-1 ring-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground text-center">
              ประกันหมดอายุแล้ว · ไม่สามารถยื่นเคลมได้
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
