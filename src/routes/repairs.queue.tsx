import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, LayoutGrid, List } from "lucide-react";
import { KanbanBoard } from "@/components/fixflow/kanban-board";
import { allRepairs } from "@/mocks";
import type { Repair, RepairStatus } from "@/mocks/types";

export const Route = createFileRoute("/repairs/queue")({
  head: () => ({ meta: [{ title: "คิวช่าง · FIXFLOW" }, { name: "description", content: "Kanban คิวงานซ่อมของช่าง" }] }),
  component: QueuePage,
});

function QueuePage() {
  const [repairs, setRepairs] = useState<Repair[]>(allRepairs());

  const move = (id: string, to: RepairStatus) => {
    setRepairs((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: to, updatedAt: new Date().toISOString() } : r,
      ),
    );
  };

  const byStatus = {
    received: repairs.filter((r) => r.status === "received"),
    diagnosing: repairs.filter((r) => r.status === "diagnosing"),
    waiting_parts: repairs.filter((r) => r.status === "waiting_parts"),
    repairing: repairs.filter((r) => r.status === "repairing"),
    completed: repairs.filter((r) => r.status === "completed"),
    picked_up: repairs.filter((r) => r.status === "picked_up"),
    canceled: repairs.filter((r) => r.status === "canceled"),
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/repairs" className="size-8 grid place-items-center rounded-lg hover:bg-muted -ml-2">
          <ChevronLeft className="size-5" />
        </Link>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Operations Center</p>
      </div>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">คิวช่าง</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ลากการ์ดเพื่ออัปเดตสถานะ · ทั้งหมด {repairs.filter((r) => r.status !== "picked_up").length} งานที่ยังเปิดอยู่
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-muted p-0.5 ring-1 ring-border">
          <Link
            to="/repairs"
            className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5"
          >
            <List className="size-3.5" /> รายการ
          </Link>
          <span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-card ring-1 ring-border inline-flex items-center gap-1.5">
            <LayoutGrid className="size-3.5" /> คิว Kanban
          </span>
        </div>
      </div>

      <KanbanBoard byStatus={byStatus} onMove={move} />

      <p className="text-[11px] text-muted-foreground mt-4">
        * การย้ายงานในหน้านี้เป็นการสาธิต ข้อมูลจะถูกรีเซ็ตเมื่อรีโหลดหน้า
      </p>
    </div>
  );
}
