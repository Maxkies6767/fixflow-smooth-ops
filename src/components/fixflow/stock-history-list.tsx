import { Link } from "@tanstack/react-router";
import { useStockMovements } from "@/mocks/stock-movements-store";
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, History } from "lucide-react";

export function StockHistoryList({ partId }: { partId: string }) {
  const movements = useStockMovements(partId);
  if (movements.length === 0) {
    return (
      <div className="rounded-lg bg-muted/40 ring-1 ring-border p-6 text-center">
        <History className="size-5 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">ยังไม่มีประวัติเข้า-ออกสต็อก</p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {movements.map((m) => {
        const isIn = m.type === "in" || (m.type === "adjust" && m.qty > 0);
        const Icon = m.type === "in" ? ArrowDownToLine : m.type === "out" ? ArrowUpFromLine : SlidersHorizontal;
        const sign = m.qty > 0 ? "+" : "";
        return (
          <div key={m.id} className="flex items-center gap-3 bg-card ring-1 ring-border rounded-lg p-2.5">
            <div className={`size-8 rounded-md grid place-items-center shrink-0 ${isIn ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              <Icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {m.type === "in" ? "เติมเข้า" : m.type === "out" ? "เบิกออก" : "ปรับสต็อก"}
                {m.note ? <span className="text-muted-foreground"> · {m.note}</span> : null}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(m.at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })} · {m.by}
                {m.refRepairId ? (
                  <>
                    {" · "}
                    <Link
                      to="/repairs/$id"
                      params={{ id: m.refRepairId }}
                      className="text-brand font-medium hover:underline"
                    >
                      ใบงาน {m.refRepairId}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold tabular-nums ${isIn ? "text-success" : "text-warning"}`}>
                {sign}{m.qty}
              </p>
              <p className="text-[10px] text-muted-foreground">เหลือ {m.stockAfter}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
