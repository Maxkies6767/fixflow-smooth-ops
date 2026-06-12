import { Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, ExternalLink, Plus, Printer } from "lucide-react";
import { QrPlaceholder } from "./qr-placeholder";
import { IntakeReceipt80mm, type IntakeReceiptData } from "./intake-receipt-80mm";

interface Props {
  repairId: string;
  trackingCode: string;
  customerName: string;
  onNewIntake: () => void;
  receipt?: IntakeReceiptData;
}

export function IntakeSuccess({ repairId, trackingCode, customerName, onNewIntake, receipt }: Props) {
  const trackUrl = `/track/${trackingCode}`;
  const fullTrackUrl = typeof window !== "undefined" ? `${window.location.origin}${trackUrl}` : trackUrl;
  return (
    <>
      <div className="max-w-xl mx-auto px-4 lg:px-0 py-8 space-y-6 print:hidden">
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold">เปิดใบรับเครื่องเรียบร้อย</h2>
          <p className="text-sm text-muted-foreground">
            {customerName} · งาน <span className="font-mono text-foreground">#{repairId}</span>
          </p>
        </div>

        <div className="bg-card ring-1 ring-border rounded-xl p-6 flex flex-col items-center gap-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">QR ติดตามงาน</p>
          <QrPlaceholder value={fullTrackUrl} code={trackingCode} size={180} />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ลิงก์ติดตามสาธารณะ</p>
            <p className="font-mono text-sm text-brand">{trackUrl}</p>
          </div>
        </div>

        <div className="grid gap-2.5">
          {receipt && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground min-h-[48px] text-sm font-semibold hover:opacity-90"
            >
              <Printer className="size-4" /> พิมพ์ใบรับเครื่อง 80mm
            </button>
          )}
          <Link
            to="/repairs/$id/receipt"
            params={{ id: repairId }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background min-h-[48px] text-sm font-semibold"
          >
            <FileText className="size-4" /> ดูใบรับซ่อม
          </Link>
          <Link
            to="/track/$code"
            params={{ code: trackingCode }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-card ring-1 ring-border min-h-[48px] text-sm font-semibold hover:bg-accent"
          >
            <ExternalLink className="size-4" /> เปิดหน้าติดตาม
          </Link>
          <button
            type="button"
            onClick={onNewIntake}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-card ring-1 ring-border min-h-[48px] text-sm font-semibold hover:bg-accent"
          >
            <Plus className="size-4" /> รับเครื่องใหม่อีกเครื่อง
          </button>
        </div>
      </div>

      {receipt && (
        <div className="hidden print:block">
          <IntakeReceipt80mm data={receipt} trackUrl={fullTrackUrl} />
        </div>
      )}
    </>
  );
}
