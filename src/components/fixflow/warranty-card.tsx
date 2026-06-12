import { Link } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, ShieldOff, ShieldQuestion, Zap } from "lucide-react";
import type { Warranty } from "@/mocks/types";
import { WARRANTY_STATUS_LABEL } from "@/mocks/types";
import { daysLeft } from "@/mocks/warranty-store";
import { QuickClaimDialog } from "./quick-claim-dialog";

const STYLE: Record<Warranty["status"], { icon: typeof ShieldCheck; badge: string; bar: string }> = {
  active: { icon: ShieldCheck, badge: "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300", bar: "bg-emerald-500" },
  expiring: { icon: ShieldAlert, badge: "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-950/50 dark:text-amber-300", bar: "bg-amber-500" },
  expired: { icon: ShieldOff, badge: "bg-zinc-100 text-zinc-600 ring-zinc-400/30 dark:bg-zinc-800 dark:text-zinc-400", bar: "bg-zinc-400" },
  claimed: { icon: ShieldQuestion, badge: "bg-teal-50 text-teal-700 ring-teal-500/20 dark:bg-teal-950/50 dark:text-teal-300", bar: "bg-teal-500" },
};

export function WarrantyCard({ w, showQuickClaim = true }: { w: Warranty; showQuickClaim?: boolean }) {
  const s = STYLE[w.status];
  const Icon = s.icon;
  const left = daysLeft(w.endDate);
  const pct = Math.min(100, Math.max(0, (left / w.days) * 100));
  const canClaim = w.status === "active" || w.status === "expiring";

  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-4 hover:ring-brand/30 transition">
      <Link to="/warranty/$id" params={{ id: w.id }} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-muted-foreground">#{w.id} · {w.repairId}</p>
              <h3 className="text-sm font-semibold truncate">{w.device}</h3>
              <p className="text-xs text-muted-foreground truncate">{w.partName} · {w.customerName}</p>
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.badge}`}>
            {WARRANTY_STATUS_LABEL[w.status]}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>{w.startDate} → {w.endDate}</span>
            <span className="tabular-nums font-medium text-foreground">
              {w.status === "expired" ? "หมดอายุแล้ว" : w.status === "claimed" ? "เคลมแล้ว" : `เหลือ ${left} วัน`}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${s.bar}`} style={{ width: `${w.status === "expired" ? 100 : pct}%` }} />
          </div>
        </div>
      </Link>
      {showQuickClaim && canClaim && (
        <QuickClaimDialog w={w}>
          <button
            onClick={(e) => e.stopPropagation()}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 py-2 text-xs font-semibold"
          >
            <Zap className="size-3.5" /> เคลมเลย (1 คลิก)
          </button>
        </QuickClaimDialog>
      )}
    </div>
  );
}
