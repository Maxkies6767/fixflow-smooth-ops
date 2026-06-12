import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/fixflow/public-shell";
import { TrackingTimeline } from "@/components/fixflow/tracking-timeline";
import { QrPlaceholder } from "@/components/fixflow/qr-placeholder";
import { SHOP, fmtBaht } from "@/mocks";
import { useRepair } from "@/mocks/repairs-store";
import { useWarrantyForRepair, daysLeft } from "@/mocks/warranty-store";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageCircle, Wrench, Clock, ShieldCheck } from "lucide-react";
import type { Repair } from "@/mocks/types";

export const Route = createFileRoute("/track/$code")({
  ssr: false,
  loader: async ({ params }): Promise<Repair> => {
    const { data, error } = await supabase.rpc("get_repair_by_tracking_code", {
      _code: params.code,
    });
    if (error) throw error;
    if (!data) throw notFound();
    return data as unknown as Repair;
  },
  head: ({ loaderData }: { loaderData?: Repair }) => ({
    meta: [
      { title: `ติดตามงานซ่อม ${loaderData?.trackingCode ?? ""} · FIXFLOW` },
      { name: "description", content: "ติดตามสถานะการซ่อมเครื่องของคุณแบบ Real-time" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <PublicShell>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">ไม่พบรหัสติดตามนี้</h1>
        <p className="text-sm text-muted-foreground mt-2">
          กรุณาตรวจสอบรหัสบนใบรับซ่อมอีกครั้ง
        </p>
      </div>
    </PublicShell>
  ),
  errorComponent: () => (
    <PublicShell>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">เกิดข้อผิดพลาด</h1>
        <p className="text-sm text-muted-foreground mt-2">โหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      </div>
    </PublicShell>
  ),
  component: TrackPage,
});

function TrackPage() {
  const initial = Route.useLoaderData() as Repair;
  const live = useRepair(initial.id);
  const r = live ?? initial;
  const warranty = useWarrantyForRepair(r.id);

  // Lightweight auto-refresh — bump tick every 15s so derived UI (relative times) re-renders
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const showParts =
    r.partsUsed.length > 0 &&
    ["repairing", "completed", "picked_up"].includes(r.status);
  const recentNotes = r.notes.slice(0, 3);

  return (
    <PublicShell>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <section className="bg-card ring-1 ring-border rounded-xl p-5">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
            รหัสติดตาม #{r.trackingCode}
          </p>
          <h1 className="text-xl font-semibold mt-1">{r.brand} {r.model}</h1>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.problem}</p>
        </section>

        <section className="bg-card ring-1 ring-border rounded-xl p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            สถานะการซ่อม
          </h2>
          <TrackingTimeline current={r.status} updatedAt={r.updatedAt} />
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            หน้านี้รีเฟรชสถานะอัตโนมัติทุก 15 วินาที
          </p>
        </section>

        {showParts && (
          <section className="bg-card ring-1 ring-border rounded-xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              อะไหล่ / บริการที่ใช้
            </h2>
            <div className="space-y-2">
              {r.partsUsed.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <div className="size-8 rounded-md bg-brand/10 text-brand grid place-items-center shrink-0">
                    <Wrench className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    {p.sku && <p className="text-[10px] font-mono text-muted-foreground">{p.sku}</p>}
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0">× {p.qty}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {recentNotes.length > 0 && (
          <section className="bg-card ring-1 ring-border rounded-xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Clock className="size-3" /> กิจกรรมล่าสุด
            </h2>
            <div className="space-y-3">
              {recentNotes.map((n, i) => (
                <div key={i} className="relative pl-4 border-l border-border last:border-l-transparent pb-1">
                  <div className={`absolute -left-[4.5px] top-1.5 size-2 rounded-full ${i === 0 ? "bg-brand" : "bg-muted-foreground/30"}`} />
                  <p className="text-sm">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.at).toLocaleString("th-TH")}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-card ring-1 ring-border rounded-xl p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground">ราคาประเมิน</p>
            <p className="text-base font-semibold tabular-nums">{fmtBaht(r.estimatedPrice)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">มัดจำ</p>
            <p className="text-base font-semibold tabular-nums">{fmtBaht(r.deposit)}</p>
          </div>
          <div className="col-span-2 pt-3 border-t border-border flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">คงเหลือชำระเมื่อมารับ</span>
            <span className="text-lg font-bold tabular-nums text-brand">
              {fmtBaht(Math.max(0, r.estimatedPrice - r.deposit))}
            </span>
          </div>
        </section>

        {warranty && (
          <section className="bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-1">
              <ShieldCheck className="size-4" />
              <h2 className="text-sm font-semibold">รับประกัน {warranty.days} วัน</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {warranty.status === "claimed"
                ? "เคลมประกันแล้ว"
                : warranty.status === "expired"
                  ? `หมดอายุ ${warranty.endDate}`
                  : `เหลือ ${daysLeft(warranty.endDate)} วัน · หมดอายุ ${warranty.endDate}`}
            </p>
          </section>
        )}

        <section className="bg-card ring-1 ring-border rounded-xl p-5 text-center">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            QR Code งานซ่อม
          </h2>
          <div className="flex justify-center">
            <QrPlaceholder
              value={typeof window !== "undefined" ? window.location.href : (r.trackingCode ?? r.id)}
              code={r.trackingCode ?? r.id}
              size={160}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            แสดง QR นี้กับพนักงานเมื่อมารับเครื่อง
          </p>
        </section>

        <section className="bg-card ring-1 ring-border rounded-xl p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            ติดต่อร้าน
          </h2>
          <p className="text-sm font-medium">{SHOP.name} · {SHOP.branch}</p>
          <p className="text-xs text-muted-foreground mt-1">{SHOP.address}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={`tel:${SHOP.phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground py-2.5 text-sm font-semibold min-h-[44px]"
            >
              <Phone className="size-4" /> โทรหาร้าน
            </a>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-muted ring-1 ring-border py-2.5 text-sm font-medium min-h-[44px]"
            >
              <MessageCircle className="size-4 text-success" /> แชท LINE
            </Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
