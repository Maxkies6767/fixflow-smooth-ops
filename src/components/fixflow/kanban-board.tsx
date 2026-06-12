import { Link } from "@tanstack/react-router";
import { StatusBadge } from "./status-badge";
import type { Repair, RepairStatus } from "@/mocks/types";
import { STATUS_LABEL } from "@/mocks/types";
import { fmtBaht } from "@/mocks";
import { GripVertical } from "lucide-react";

const COLUMNS: RepairStatus[] = ["received", "diagnosing", "waiting_parts", "repairing", "completed"];

const COL_ACCENT: Record<RepairStatus, string> = {
  received: "border-zinc-300 dark:border-zinc-700",
  diagnosing: "border-sky-300 dark:border-sky-700",
  waiting_parts: "border-amber-300 dark:border-amber-700",
  repairing: "border-emerald-300 dark:border-emerald-700",
  completed: "border-teal-400 dark:border-teal-600",
  picked_up: "border-zinc-400",
  canceled: "border-rose-300 dark:border-rose-700",
};

export function KanbanBoard({
  byStatus,
  onMove,
}: {
  byStatus: Record<RepairStatus, Repair[]>;
  onMove: (id: string, to: RepairStatus) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x">
      {COLUMNS.map((s) => (
        <Column
          key={s}
          status={s}
          items={byStatus[s] ?? []}
          onDrop={(id) => onMove(id, s)}
          onMove={onMove}
        />
      ))}
    </div>
  );
}

function Column({
  status, items, onDrop, onMove,
}: {
  status: RepairStatus;
  items: Repair[];
  onDrop: (id: string) => void;
  onMove: (id: string, to: RepairStatus) => void;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
      className={`shrink-0 w-[78vw] sm:w-72 snap-start bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl border-t-4 ${COL_ACCENT[status]}`}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <h3 className="text-sm font-semibold">{STATUS_LABEL[status]}</h3>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          {String(items.length).padStart(2, "0")}
        </span>
      </div>
      <div className="px-2 pb-2 space-y-2 min-h-[120px]">
        {items.length === 0 ? (
          <div className="text-[11px] text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
            ลากการ์ดมาวางที่นี่
          </div>
        ) : (
          items.map((r) => <KanbanCard key={r.id} repair={r} onMove={onMove} />)
        )}
      </div>
    </div>
  );
}

function KanbanCard({ repair, onMove }: { repair: Repair; onMove: (id: string, to: RepairStatus) => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", repair.id)}
      className="group bg-background ring-1 ring-border rounded-lg p-2.5 hover:ring-brand/40 transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">#{repair.id}</span>
            <div className="flex items-center gap-1">
              {repair.isWalkIn && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30">
                  🪑 นั่งรอ
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">{repair.technician}</span>
            </div>
          </div>
          <Link
            to="/repairs/$id"
            params={{ id: repair.id }}
            className="block text-sm font-medium truncate hover:text-brand"
          >
            {repair.model}
          </Link>
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{repair.problem}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground truncate">{repair.customerName.replace("คุณ", "")}</span>
            <span className="text-[11px] font-semibold tabular-nums">{fmtBaht(repair.estimatedPrice)}</span>
          </div>
          {/* tap-to-move fallback */}
          <select
            value={repair.status}
            onChange={(e) => onMove(repair.id, e.target.value as RepairStatus)}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 w-full text-[10px] bg-muted rounded px-1.5 py-1 ring-1 ring-border outline-none"
          >
            {COLUMNS.map((s) => (
              <option key={s} value={s}>ย้าย → {STATUS_LABEL[s]}</option>
            ))}
          </select>
          {repair.status === "completed" && (
            <div className="mt-1 flex justify-end">
              <StatusBadge status={repair.status} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
