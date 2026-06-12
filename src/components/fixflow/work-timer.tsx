import { useEffect, useState } from "react";
import { Play, Square, Timer as TimerIcon } from "lucide-react";
import { toast } from "sonner";
import {
  startWorkSession,
  stopWorkSession,
} from "@/mocks/repairs-store";
import { useShopSettings } from "@/mocks/shop-settings";
import { fmtBaht } from "@/mocks";
import type { Repair } from "@/mocks/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtHMS(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Total elapsed seconds across all sessions, including the live active one. */
function totalWorkSeconds(r: Repair): number {
  const sessions = r.workSessions ?? [];
  let total = 0;
  for (const s of sessions) {
    const end = s.end ? new Date(s.end).getTime() : Date.now();
    total += Math.max(0, Math.round((end - new Date(s.start).getTime()) / 1000));
  }
  return total;
}

export function WorkTimer({ repair }: { repair: Repair }) {
  const settings = useShopSettings();
  const rate = repair.laborRatePerHour ?? settings.laborRatePerHour;
  const sessions = repair.workSessions ?? [];
  const active = sessions.find((s) => !s.end);
  const [, force] = useState(0);

  // Tick every 1s while a session is active so HH:MM:SS updates live
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const totalSec = totalWorkSeconds(repair);
  const laborCost = Math.round((totalSec / 3600) * rate);

  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          จับเวลาทำงาน
        </h2>
        {active && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            กำลังทำงาน
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="size-11 rounded-lg bg-brand/10 text-brand grid place-items-center">
          <TimerIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-2xl font-bold tabular-nums">{fmtHMS(totalSec)}</p>
          <p className="text-[11px] text-muted-foreground">
            อัตรา {fmtBaht(rate)}/ชม. · ค่าแรงสะสม{" "}
            <span className="font-semibold text-foreground">{fmtBaht(laborCost)}</span>
          </p>
        </div>
        {active ? (
          <button
            onClick={() => {
              stopWorkSession(repair.id);
              toast.success("หยุดจับเวลาแล้ว");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive text-destructive-foreground px-3 h-10 text-sm font-semibold"
          >
            <Square className="size-3.5" /> หยุด
          </button>
        ) : (
          <button
            onClick={() => {
              if (repair.status === "canceled" || repair.status === "picked_up") {
                toast.error("ใบงานนี้ปิดแล้ว ไม่สามารถจับเวลา");
                return;
              }
              startWorkSession(repair.id);
              toast.success("เริ่มจับเวลา");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 h-10 text-sm font-semibold"
          >
            <Play className="size-3.5" /> เริ่ม
          </button>
        )}
      </div>

      {sessions.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none hover:text-foreground">
            ดูเซสชันทั้งหมด ({sessions.length})
          </summary>
          <ul className="mt-2 space-y-1 pl-2">
            {sessions
              .slice()
              .reverse()
              .map((s) => {
                const end = s.end ? new Date(s.end) : null;
                const start = new Date(s.start);
                const sec = end
                  ? Math.round((end.getTime() - start.getTime()) / 1000)
                  : Math.round((Date.now() - start.getTime()) / 1000);
                return (
                  <li key={s.id} className="font-mono">
                    {start.toLocaleString("th-TH")} →{" "}
                    {end ? end.toLocaleTimeString("th-TH") : "กำลังทำงาน"} ·{" "}
                    {fmtHMS(sec)}
                  </li>
                );
              })}
          </ul>
        </details>
      )}
    </section>
  );
}
