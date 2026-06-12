import { Check, Loader2 } from "lucide-react";
import type { RepairStatus } from "@/mocks/types";

const ORDER: { key: RepairStatus; label: string; desc: string }[] = [
  { key: "received", label: "รับเครื่องแล้ว", desc: "ทางร้านได้รับเครื่องและออกใบรับซ่อมเรียบร้อย" },
  { key: "diagnosing", label: "กำลังตรวจเช็ก", desc: "ช่างกำลังตรวจหาสาเหตุและประเมินค่าใช้จ่าย" },
  { key: "waiting_parts", label: "รออะไหล่", desc: "สั่งอะไหล่เข้าร้าน อาจใช้เวลา 1–3 วัน" },
  { key: "repairing", label: "กำลังซ่อม", desc: "ช่างกำลังดำเนินการซ่อมตามที่ประเมินไว้" },
  { key: "completed", label: "ซ่อมเสร็จ", desc: "พร้อมให้ลูกค้ามารับเครื่องที่ร้าน" },
  { key: "picked_up", label: "ลูกค้ารับเครื่องแล้ว", desc: "ขอบคุณที่ใช้บริการ FIXFLOW" },
];

export function TrackingTimeline({ current, updatedAt }: { current: RepairStatus; updatedAt: string }) {
  const idx = ORDER.findIndex((s) => s.key === current);
  return (
    <ol className="relative space-y-6">
      {ORDER.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const upcoming = i > idx;
        return (
          <li key={s.key} className="relative pl-12">
            {i < ORDER.length - 1 && (
              <span
                className={[
                  "absolute left-[15px] top-9 bottom-[-24px] w-[2px] rounded-full",
                  done ? "bg-brand" : active ? "bg-gradient-to-b from-brand to-border" : "bg-border",
                ].join(" ")}
              />
            )}
            <span
              className={[
                "absolute left-0 top-0 size-8 rounded-full grid place-items-center ring-2 transition",
                done && "bg-brand text-brand-foreground ring-brand",
                active && "bg-brand text-brand-foreground ring-brand/30 ring-offset-2 ring-offset-background shadow-md shadow-brand/30",
                upcoming && "bg-muted text-muted-foreground ring-border",
              ].filter(Boolean).join(" ")}
            >
              {done ? (
                <Check className="size-4" strokeWidth={3} />
              ) : active ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span className="text-[11px] font-bold">{i + 1}</span>
              )}
            </span>
            <div className={active ? "" : upcoming ? "opacity-60" : ""}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-semibold ${active ? "text-brand" : ""}`}>{s.label}</p>
                {active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand text-[10px] font-semibold px-2 py-0.5">
                    สถานะปัจจุบัน
                  </span>
                )}
                {done && (
                  <span className="text-[10px] font-medium text-muted-foreground">เสร็จแล้ว</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
              {active && (
                <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                  อัปเดตล่าสุด: {new Date(updatedAt).toLocaleString("th-TH")}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
