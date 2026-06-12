import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { fmtBaht } from "@/mocks";
import type { Repair } from "@/mocks/types";

export function RepairCard({ repair }: { repair: Repair }) {
  return (
    <Link
      to="/repairs/$id"
      params={{ id: repair.id }}
      className="block bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-4 space-y-4 hover:ring-brand/30 transition-all"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-muted-foreground tracking-tighter">#{repair.id}</span>
            {repair.isWalkIn && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30">
                🪑 นั่งรอ
              </span>
            )}
          </div>
          <h3 className="text-base font-medium leading-tight truncate">{repair.model}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{repair.problem}</p>
        </div>
        <StatusBadge status={repair.status} />
      </div>

      <div className="flex items-center gap-3 py-1 border-t border-border pt-3">
        <div className="size-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold text-muted-foreground shrink-0">
          {repair.customerName.slice(3, 5)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{repair.customerName}</p>
          <p className="text-xs text-muted-foreground">{repair.phone}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground">ราคาประเมิน</p>
          <p className="text-sm font-semibold tabular-nums">{fmtBaht(repair.estimatedPrice)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={(e) => e.preventDefault()}
          className="flex items-center justify-center gap-2 rounded-lg bg-foreground text-background text-sm font-medium py-2 min-h-[40px] active:scale-[0.98] transition-transform"
        >
          <Phone className="size-4" />
          โทรออก
        </button>
        <button
          onClick={(e) => e.preventDefault()}
          className="flex items-center justify-center gap-2 rounded-lg bg-card ring-1 ring-border text-foreground text-sm font-medium py-2 min-h-[40px] active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="size-4 text-success" />
          แชท LINE
        </button>
      </div>
    </Link>
  );
}
