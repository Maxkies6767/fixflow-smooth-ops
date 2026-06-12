import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeader({
  label, action, className,
}: { label: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-1 mb-3", className)}>
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </h2>
      {action}
    </div>
  );
}

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Operations Center
        </p>
        <h1 className="text-2xl font-semibold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}
