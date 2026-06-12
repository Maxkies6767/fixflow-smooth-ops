import { fmtBaht } from "@/mocks";
import { useShopSettings } from "@/mocks/shop-settings";
import type { Repair } from "@/mocks/types";
import { QrPlaceholder } from "./qr-placeholder";


export function Receipt80mm({ repair, trackUrl }: { repair: Repair; trackUrl: string }) {
  const shop = useShopSettings();
  const balance = Math.max(0, repair.estimatedPrice - repair.deposit);
  const received = new Date(repair.createdAt);
  const expected = new Date(received.getTime() + 3 * 86400000);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <div
      className="printable-receipt mx-auto bg-white text-zinc-900 font-mono text-[11px] leading-tight"
      style={{ width: "302px", padding: "16px 14px" }}
    >
      <div className="text-center">
        <div className="text-[16px] font-bold tracking-widest">FIXFLOW</div>
        <div className="text-[10px]">{shop.name} · {shop.branch}</div>
        <div className="text-[10px]">{shop.address}</div>
        <div className="text-[10px]">โทร {shop.phone}</div>
        <div className="text-[10px]">เลขผู้เสียภาษี {shop.taxId}</div>
      </div>

      <div className="border-t border-dashed border-zinc-400 my-2" />
      <div className="text-center font-bold text-[12px] tracking-widest">{shop.receiptHeader}</div>
      <div className="text-center text-[10px] text-zinc-600">REPAIR ORDER</div>


      <div className="border-t border-dashed border-zinc-400 my-2" />
      <Row k="เลขที่งาน" v={`#${repair.id}`} />
      <Row k="วันที่รับ" v={fmtDate(received)} />
      <Row k="กำหนดเสร็จ" v={fmtDate(expected)} />

      <div className="border-t border-dashed border-zinc-400 my-2" />
      <div className="font-bold mb-1">ลูกค้า</div>
      <Row k="ชื่อ" v={repair.customerName} />
      <Row k="โทร" v={repair.phone} />

      <div className="border-t border-dashed border-zinc-400 my-2" />
      <div className="font-bold mb-1">เครื่อง</div>
      <Row k="ยี่ห้อ/รุ่น" v={`${repair.brand} ${repair.model}`} />
      <Row k="IMEI / Serial" v={repair.imei} />
      <div className="mt-1.5">
        <div className="text-zinc-600">อาการที่แจ้ง:</div>
        <div className="font-medium leading-snug">{repair.problem}</div>
      </div>

      <div className="border-t border-dashed border-zinc-400 my-2" />
      <Row k="ราคาประเมิน" v={fmtBaht(repair.estimatedPrice)} mono />
      <Row k="มัดจำ" v={`- ${fmtBaht(repair.deposit)}`} mono />
      <div className="border-t border-zinc-900 mt-1 pt-1 flex justify-between font-bold text-[13px]">
        <span>คงเหลือ</span>
        <span className="tabular-nums">{fmtBaht(balance)}</span>
      </div>

      <div className="border-t border-dashed border-zinc-400 my-3" />
      <div className="flex flex-col items-center gap-1.5">
        <QrPlaceholder value={trackUrl} code={repair.trackingCode ?? repair.id} size={130} />
        <div className="text-[10px] text-center font-medium">สแกนเพื่อติดตามสถานะ</div>
        <div className="text-[9px] text-center break-all text-zinc-600">{trackUrl}</div>
      </div>

      <div className="border-t border-dashed border-zinc-400 my-2" />
      <div className="font-bold text-[10px] mb-0.5">การรับประกัน</div>
      <div className="text-[10px] leading-snug">
        รับประกันงานซ่อม {repair.warrantyDays ?? 7} วัน นับจากวันรับเครื่องคืน
        เฉพาะอาการเดิมที่แจ้งซ่อมเท่านั้น
      </div>

      <div className="border-t border-dashed border-zinc-400 my-2" />
      <div className="font-bold text-[10px] mb-0.5">ข้อตกลง</div>
      <div className="text-[9px] leading-snug text-zinc-700">
        1. ข้อมูล/ของในเครื่องเป็นความรับผิดชอบของลูกค้า{"\n"}
        2. กรณีตรวจแล้วไม่ซ่อม คิดค่าตรวจ 100 บาท{"\n"}
        3. หากไม่มารับเครื่องภายใน 90 วัน ทางร้านขอสงวนสิทธิ์จำหน่ายเพื่อชดเชยค่าซ่อม{"\n"}
        4. กรุณาแสดงใบรับซ่อมหรือ QR ทุกครั้งที่มารับเครื่อง
      </div>

      <div className="mt-3 text-center text-[10px]">— {shop.receiptFooter} —</div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-600 shrink-0">{k}</span>
      <span className={mono ? "tabular-nums text-right" : "text-right"}>{v}</span>
    </div>
  );
}
