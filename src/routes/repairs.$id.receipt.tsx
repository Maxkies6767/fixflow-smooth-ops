import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, ChevronLeft } from "lucide-react";
import { Receipt80mm } from "@/components/fixflow/receipt-80mm";
import { useRepair } from "@/mocks/repairs-store";

export const Route = createFileRoute("/repairs/$id/receipt")({
  head: () => ({
    meta: [{ title: "ใบรับซ่อม · FIXFLOW" }],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const r = useRepair(id);

  if (!r) {
    return (
      <div className="min-h-screen grid place-items-center p-10 text-center text-muted-foreground">
        <div className="space-y-3">
          <p>ไม่พบงานซ่อมนี้</p>
          <Link to="/repairs" className="text-brand text-sm font-medium">กลับไปหน้ารายการ</Link>
        </div>
      </div>
    );
  }

  const trackUrl = `https://fixflow.app/track/${r.trackingCode ?? r.id}`;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <div className="no-print sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <Link
          to="/repairs/$id"
          params={{ id: r.id }}
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-brand"
        >
          <ChevronLeft className="size-4" /> กลับ
        </Link>
        <div className="text-xs text-muted-foreground hidden sm:block">
          พรีวิวกระดาษ 80mm · #{r.id}
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-4 py-2 text-sm font-semibold min-h-[40px]"
        >
          <Printer className="size-4" /> ปริ้น
        </button>
      </div>

      <div className="py-8 px-4 flex justify-center">
        <div className="bg-white shadow-xl ring-1 ring-black/10">
          <Receipt80mm repair={r} trackUrl={trackUrl} />
        </div>
      </div>
    </div>
  );
}
