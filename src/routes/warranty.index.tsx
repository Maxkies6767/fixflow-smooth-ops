import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/fixflow/section";
import { WarrantyCard } from "@/components/fixflow/warranty-card";
import { useWarrantiesList } from "@/mocks/warranty-store";
import type { WarrantyStatus } from "@/mocks/types";
import { WARRANTY_STATUS_LABEL } from "@/mocks/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/warranty/")({
  head: () => ({
    meta: [
      { title: "การรับประกัน · FIXFLOW" },
      { name: "description", content: "จัดการการรับประกันงานซ่อมและรายการเคลม" },
    ],
  }),
  component: WarrantyListPage,
});

const FILTERS: Array<{ key: "all" | WarrantyStatus; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: WARRANTY_STATUS_LABEL.active },
  { key: "expiring", label: WARRANTY_STATUS_LABEL.expiring },
  { key: "expired", label: WARRANTY_STATUS_LABEL.expired },
  { key: "claimed", label: WARRANTY_STATUS_LABEL.claimed },
];

function WarrantyListPage() {
  const [f, setF] = useState<"all" | WarrantyStatus>("all");
  const all = useWarrantiesList();
  const list = f === "all" ? all : all.filter((w) => w.status === f);

  const counts = {
    active: all.filter((w) => w.status === "active").length,
    expiring: all.filter((w) => w.status === "expiring").length,
    expired: all.filter((w) => w.status === "expired").length,
    claimed: all.filter((w) => w.status === "claimed").length,
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto">
      <PageHeader
        title="การรับประกัน"
        subtitle={`ทั้งหมด ${all.length} รายการ · ใกล้หมดอายุ ${counts.expiring} · เคลม ${counts.claimed}`}
      />

      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat label="ใช้งานอยู่" value={counts.active} tone="text-emerald-600" />
        <Stat label="ใกล้หมด" value={counts.expiring} tone="text-amber-600" />
        <Stat label="หมดอายุ" value={counts.expired} tone="text-zinc-500" />
        <Stat label="เคลมแล้ว" value={counts.claimed} tone="text-teal-600" />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2 mb-3">
        {FILTERS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setF(opt.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
              f === opt.key
                ? "bg-foreground text-background ring-foreground"
                : "bg-card text-muted-foreground ring-border hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <ShieldCheck className="size-8 mx-auto mb-2 opacity-30" />
            ไม่มีรายการในกลุ่มนี้
          </div>
        ) : (
          list.map((w) => <WarrantyCard key={w.id} w={w} />)
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold tabular-nums leading-none mt-1 ${tone}`}>
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}
