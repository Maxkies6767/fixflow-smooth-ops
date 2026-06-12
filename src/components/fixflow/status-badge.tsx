import type { RepairStatus } from "@/mocks/types";
import { STATUS_LABEL } from "@/mocks/types";
import { cn } from "@/lib/utils";

const STYLES: Record<RepairStatus, string> = {
  received: "bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300",
  diagnosing: "bg-sky-50 text-sky-700 ring-sky-500/20 dark:bg-sky-950/50 dark:text-sky-300",
  waiting_parts: "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-950/50 dark:text-amber-300",
  repairing: "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300",
  completed: "bg-teal-50 text-teal-700 ring-teal-500/20 dark:bg-teal-950/50 dark:text-teal-300",
  picked_up: "bg-zinc-900 text-zinc-50 ring-zinc-900/30 dark:bg-zinc-100 dark:text-zinc-900",
  canceled: "bg-rose-50 text-rose-700 ring-rose-500/20 dark:bg-rose-950/50 dark:text-rose-300",
};

export function StatusBadge({ status, className }: { status: RepairStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
