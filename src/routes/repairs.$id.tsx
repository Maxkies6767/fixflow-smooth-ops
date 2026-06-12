import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Phone, MessageCircle, Printer, Edit3, ShieldCheck, Send, Wrench, Plus, RotateCcw, Trash2, XCircle, Lock, History } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/fixflow/status-badge";
import { NotifyDialog } from "@/components/fixflow/notify-dialog";
import { QrPlaceholder } from "@/components/fixflow/qr-placeholder";
import { IssuePartsDialog } from "@/components/fixflow/issue-parts-dialog";
import { WorkTimer } from "@/components/fixflow/work-timer";
import { WarrantyRegisterDialog } from "@/components/fixflow/warranty-register-dialog";
import { fmtBaht, repairsByImei } from "@/mocks";
import { useRepair, setRepairStatus, returnPartFromRepair, cancelRepair, totalWorkMinutes } from "@/mocks/repairs-store";
import { useWarrantyForRepair } from "@/mocks/warranty-store";
import { useShopSettings } from "@/mocks/shop-settings";
import { CONDITION_LABEL, type Repair } from "@/mocks/types";

export const Route = createFileRoute("/repairs/$id")({
  head: () => ({
    meta: [{ title: "งานซ่อม · FIXFLOW" }],
  }),
  component: RepairDetailPage,
});

function RepairDetailPage() {
  const { id } = Route.useParams();
  const r = useRepair(id);
  if (!r) {
    return (
      <div className="min-h-screen grid place-items-center p-10 text-center text-muted-foreground">
        <div className="space-y-3">
          <p>ไม่พบงานซ่อมนี้</p>
          <Link to="/repairs" className="text-brand text-sm font-medium">กลับไปหน้ารายการ</Link>
        </div>
      </div>
    );
  }
  const shopSettings = useShopSettings();
  const [issueOpen, setIssueOpen] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const existingWarranty = useWarrantyForRepair(r.id);
  const canRegisterWarranty = r.status === "completed" || r.status === "picked_up";

  // Auto-generated timeline from notes (most-recent-first → flip to chronological)
  const timeline = [
    { at: r.createdAt, label: "รับเครื่อง", by: "คุณกานต์" },
    ...r.notes.slice().reverse().map((n) => ({ at: n.at, label: n.text, by: n.by })),
  ];

  const partsTotal = r.partsUsed.reduce((s, p) => s + p.price * p.qty, 0);
  const laborMin = totalWorkMinutes(r);
  const laborRate = r.laborRatePerHour ?? shopSettings.laborRatePerHour;
  const laborCost = Math.round((laborMin / 60) * laborRate);
  const grandTotal = r.estimatedPrice + laborCost;

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-10 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/repairs" className="size-9 grid place-items-center rounded-lg hover:bg-muted -ml-2">
            <ChevronLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted-foreground tracking-tighter">#{r.id}</p>
            <h1 className="text-lg font-semibold truncate">{r.model}</h1>
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      {r.isWalkIn && (
        <div className="px-4 lg:px-10 pt-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-300 dark:ring-amber-700 px-4 py-3">
            <span className="size-9 rounded-lg bg-amber-500 text-white grid place-items-center shrink-0 text-base">🪑</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">ลูกค้านั่งรอที่ร้าน</p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80">เร่งจัดการให้เสร็จก่อนงานอื่น</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 lg:px-10 py-6 max-w-5xl mx-auto grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="ข้อมูลลูกค้า">
            <KV k="ชื่อ" v={r.customerName} />
            <KV k="เบอร์โทร" v={r.phone} />
            <div className="flex gap-2 pt-2">
              <ActionBtn icon={Phone}>โทรออก</ActionBtn>
              <ActionBtn icon={MessageCircle} className="text-success">แชท LINE</ActionBtn>
            </div>
          </Card>

          <Card title="ข้อมูลเครื่อง">
            <KV k="ยี่ห้อ / รุ่น" v={`${r.brand} ${r.model}`} />
            <KV k="IMEI" v={<span className="font-mono">{r.imei}</span>} />
            <KV k="อาการเสีย" v={r.problem} />
            {r.conditions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">สภาพเครื่อง</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.conditions.map((c) => (
                    <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-warning/10 text-warning ring-1 ring-warning/20">
                      {CONDITION_LABEL[c]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="ไทม์ไลน์การซ่อม">
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {timeline.map((t, i) => (
                <div key={i} className="relative pl-5 border-l border-border pb-1 last:border-l-transparent">
                  <div className={`absolute -left-[4.5px] top-1.5 size-2 rounded-full ${i === timeline.length - 1 ? "bg-brand" : "bg-muted-foreground/30"}`} />
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString("th-TH")} · {t.by}</p>
                </div>
              ))}
            </div>
          </Card>

          <WorkTimer repair={r} />

          <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                อะไหล่ที่ใช้
              </h2>
              <button
                onClick={() => setIssueOpen(true)}
                disabled={r.status === "canceled"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 h-9 text-xs font-semibold disabled:opacity-50"
              >
                <Plus className="size-3.5" /> เบิกอะไหล่
              </button>
            </div>
            {r.partsUsed.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">ยังไม่มีการเบิกอะไหล่</p>
            ) : (
              <div className="space-y-1.5">
                {r.partsUsed.map((p, i) => (
                  <div
                    key={`${p.partId ?? p.name}-${i}`}
                    className="flex items-center gap-2 bg-background ring-1 ring-border rounded-lg p-2.5"
                  >
                    <div className="size-9 rounded-md bg-brand/10 text-brand grid place-items-center shrink-0">
                      <Wrench className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.sku ? <span className="font-mono">{p.sku} · </span> : null}
                        {p.qty} × {fmtBaht(p.price)} = {fmtBaht(p.qty * p.price)}
                      </p>
                    </div>
                    {p.partId && r.status !== "canceled" && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const res = returnPartFromRepair(r.id, p.partId!, 1);
                            if (res) toast.success(`คืน 1 ชิ้นเข้าสต็อก`);
                          }}
                          title="คืน 1 ชิ้น"
                          className="size-8 rounded-md bg-muted hover:bg-accent grid place-items-center"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const res = returnPartFromRepair(r.id, p.partId!, p.qty);
                            if (res) toast.success(`คืน ${p.qty} ชิ้นเข้าสต็อก`);
                          }}
                          title="คืนทั้งหมด"
                          className="size-8 rounded-md bg-muted hover:bg-destructive/10 hover:text-destructive grid place-items-center"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>


          {r.lastNotification && (
            <Card title="การแจ้งเตือนล่าสุด">
              <p className="text-sm">
                ช่อง {r.lastNotification.channel.toUpperCase()} · เทมเพลต {r.lastNotification.template}
              </p>
              <p className="text-xs text-muted-foreground">{r.lastNotification.at}</p>
            </Card>
          )}

          <Card title="บันทึกของช่าง">
            {r.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีบันทึก</p>
            ) : (
              <div className="space-y-3">
                {r.notes.map((n, i) => (
                  <div key={i} className="text-sm">
                    <p>{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.by} · {n.at}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <ImeiHistoryCard currentId={r.id} imei={r.imei} />
        </div>

        <div className="space-y-6">
          <Card title="สรุปค่าใช้จ่าย">
            <KV k="ราคาประเมิน" v={<span className="tabular-nums">{fmtBaht(r.estimatedPrice)}</span>} />
            <KV k="เงินมัดจำ" v={<span className="tabular-nums">{fmtBaht(r.deposit)}</span>} />
            <KV k="ค่าอะไหล่" v={<span className="tabular-nums">{fmtBaht(partsTotal)}</span>} />
            <KV
              k={`ค่าแรง (${Math.floor(laborMin / 60)} ชม. ${laborMin % 60} นาที)`}
              v={<span className="tabular-nums">{fmtBaht(laborCost)}</span>}
            />
            <div className="border-t border-border pt-3 mt-1 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>รวมทั้งหมด</span>
                <span className="tabular-nums">{fmtBaht(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">คงเหลือชำระ</span>
                <span className="text-lg font-bold tabular-nums text-brand">{fmtBaht(Math.max(0, grandTotal - r.deposit))}</span>
              </div>
            </div>
          </Card>

          <Card title="QR ติดตามสถานะ">
            <div className="grid place-items-center py-2">
              <QrPlaceholder value={typeof window !== "undefined" ? `${window.location.origin}/track/${r.trackingCode ?? r.id}` : `/track/${r.trackingCode ?? r.id}`} code={r.trackingCode ?? r.id} size={160} />
            </div>
            <Link
              to="/track/$code"
              params={{ code: r.trackingCode ?? r.id }}
              className="block text-center text-[11px] text-brand font-semibold mt-2"
            >
              เปิดหน้าติดตามสาธารณะ →
            </Link>
          </Card>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setRepairStatus(r.id, nextStatus(r.status))}
              className="rounded-lg bg-brand text-brand-foreground font-semibold min-h-[44px] inline-flex items-center justify-center gap-2"
            >
              <Edit3 className="size-4" /> อัปเดตสถานะ
            </button>
            <NotifyDialog repair={r}>
              <button className="rounded-lg bg-card ring-1 ring-border font-medium min-h-[44px] inline-flex items-center justify-center gap-2 w-full">
                <Send className="size-4 text-success" /> แจ้งลูกค้า (LINE / SMS)
              </button>
            </NotifyDialog>
            <Link
              to="/repairs/$id/receipt"
              params={{ id: r.id }}
              className="rounded-lg bg-card ring-1 ring-border font-medium min-h-[44px] inline-flex items-center justify-center gap-2"
            >
              <Printer className="size-4" /> ปริ้นใบรับซ่อม (80mm)
            </Link>
            {existingWarranty ? (
              <Link
                to="/warranty/$id"
                params={{ id: existingWarranty.id }}
                className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium min-h-[44px] inline-flex items-center justify-center gap-2"
              >
                <ShieldCheck className="size-4" /> ดูใบรับประกัน · {existingWarranty.id}
              </Link>
            ) : canRegisterWarranty ? (
              <button
                onClick={() => setWarrantyOpen(true)}
                className="rounded-lg bg-card ring-1 ring-border font-medium min-h-[44px] inline-flex items-center justify-center gap-2"
              >
                <ShieldCheck className="size-4" /> ลงทะเบียนรับประกัน
              </button>
            ) : (
              <div
                className="rounded-lg bg-muted/40 ring-1 ring-border text-muted-foreground font-medium min-h-[44px] inline-flex items-center justify-center gap-2 cursor-not-allowed"
                title="ลงทะเบียนได้เมื่อสถานะ = ซ่อมเสร็จ หรือ รับเครื่องแล้ว"
              >
                <Lock className="size-3.5" /> ลงทะเบียนรับประกัน (ปิดงานก่อน)
              </div>
            )}
            {r.status !== "canceled" && r.status !== "picked_up" && (
              <button
                onClick={() => {
                  if (!confirm("ยกเลิกใบงานและคืนอะไหล่ทั้งหมดเข้าสต็อก?")) return;
                  cancelRepair(r.id);
                  toast.success("ยกเลิกใบงานแล้ว — คืนอะไหล่เข้าสต็อก");
                }}
                className="rounded-lg bg-card ring-1 ring-destructive/30 text-destructive font-medium min-h-[44px] inline-flex items-center justify-center gap-2 hover:bg-destructive/5"
              >
                <XCircle className="size-4" /> ยกเลิกใบงาน
              </button>
            )}
          </div>
        </div>
      </div>

      <IssuePartsDialog repairId={r.id} deviceBrand={r.brand} deviceModel={r.model} open={issueOpen} onOpenChange={setIssueOpen} />
      <WarrantyRegisterDialog repair={r} open={warrantyOpen} onOpenChange={setWarrantyOpen} />
    </div>
  );
}

function nextStatus(s: Repair["status"]): Repair["status"] {
  const order: Repair["status"][] = ["received", "diagnosing", "waiting_parts", "repairing", "completed", "picked_up"];
  const i = order.indexOf(s);
  return order[Math.min(order.length - 1, i + 1)];
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, children, className = "" }: { icon: typeof Phone; children: React.ReactNode; className?: string }) {
  return (
    <button className="flex-1 rounded-lg bg-muted hover:bg-accent transition-colors min-h-[40px] inline-flex items-center justify-center gap-2 text-sm font-medium">
      <Icon className={`size-4 ${className}`} />
      {children}
    </button>
  );
}

function ImeiHistoryCard({ currentId, imei }: { currentId: string; imei: string }) {
  const all = repairsByImei(imei).filter((r) => r.id !== currentId);
  if (!imei || all.length === 0) return null;
  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <History className="size-3.5" />
        ประวัติเครื่องนี้ <span className="font-mono normal-case text-[10px] text-muted-foreground/70">· IMEI …{imei.slice(-4)}</span>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground">{all.length} งานก่อนหน้า</span>
      </h2>
      <div className="space-y-2">
        {all.map((past) => (
          <Link
            key={past.id}
            to="/repairs/$id"
            params={{ id: past.id }}
            className="flex items-center justify-between gap-3 bg-background ring-1 ring-border rounded-lg p-3 hover:ring-brand/30"
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-muted-foreground">#{past.id} · {past.createdAt.slice(0, 10)}</p>
              <p className="text-sm font-medium truncate">{past.problem}</p>
            </div>
            <div className="text-right shrink-0">
              <StatusBadge status={past.status} />
              <p className="text-[11px] tabular-nums mt-1">{fmtBaht(past.estimatedPrice)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
