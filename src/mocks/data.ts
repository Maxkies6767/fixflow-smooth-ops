import type { Repair, Customer, Part, Staff, ActivityEntry, Warranty, NotificationTemplate } from "./types";

export const SHOP = {
  name: "FIXFLOW",
  branch: "สาขา สยามพารากอน",
  address: "991 ถ.พระราม 1 ปทุมวัน กรุงเทพฯ 10330",
  phone: "02-610-9999",
  taxId: "0105561234567",
};

export const STAFF: Staff[] = [
  { id: "u1", name: "คุณสมชาย ใจดี", role: "OWNER", initials: "สช" },
  { id: "u2", name: "ช่างเอก สุภาพ", role: "TECHNICIAN", initials: "อก" },
  { id: "u3", name: "ช่างวิทย์ ปัญญา", role: "TECHNICIAN", initials: "วท" },
  { id: "u4", name: "คุณกานต์ ต้อนรับ", role: "ADMIN", initials: "กต" },
];

export const CUSTOMERS: Customer[] = [];

const today = "2025-06-11";

export const REPAIRS: Repair[] = [];

export const PARTS: Part[] = [
  { id: "p1", sku: "SCR-IP14PM-OEM", name: "จอ iPhone 14 Pro Max (แท้)", category: "screens", compatible: ["iPhone 14 Pro Max"], stock: 4, minStock: 3, location: "A1-01", cost: 5800, price: 7500 },
  { id: "p2", sku: "SCR-IP15PM-OEM", name: "จอ iPhone 15 Pro Max (แท้)", category: "screens", compatible: ["iPhone 15 Pro Max"], stock: 2, minStock: 3, location: "A1-02", cost: 7200, price: 9800 },
  { id: "p3", sku: "SCR-S23U-OEM", name: "จอ Samsung S23 Ultra", category: "screens", compatible: ["Galaxy S23 Ultra"], stock: 5, minStock: 2, location: "A2-01", cost: 4200, price: 5800 },
  { id: "p4", sku: "SCR-IP11-AAA", name: "จอ iPhone 11 (เกรด AAA)", category: "screens", compatible: ["iPhone 11"], stock: 1, minStock: 3, location: "A1-03", cost: 1100, price: 1900 },
  { id: "p5", sku: "SCR-IP13-OEM", name: "จอ iPhone 13", category: "screens", compatible: ["iPhone 13", "iPhone 13 mini"], stock: 6, minStock: 3, location: "A1-04", cost: 2400, price: 3800 },
  { id: "p6", sku: "BAT-IP12P-OEM", name: "แบต iPhone 12 Pro", category: "batteries", compatible: ["iPhone 12 Pro"], stock: 1, minStock: 5, location: "B1-01", cost: 480, price: 990 },
  { id: "p7", sku: "BAT-IP13-OEM", name: "แบต iPhone 13", category: "batteries", compatible: ["iPhone 13"], stock: 8, minStock: 5, location: "B1-02", cost: 520, price: 1100 },
  { id: "p8", sku: "BAT-IPAIR5", name: "แบต iPad Air 5", category: "batteries", compatible: ["iPad Air 5"], stock: 3, minStock: 2, location: "B2-01", cost: 1100, price: 2200 },
  { id: "p9", sku: "BAT-S23U", name: "แบต Galaxy S23 Ultra", category: "batteries", compatible: ["Galaxy S23 Ultra"], stock: 4, minStock: 2, location: "B2-02", cost: 690, price: 1400 },
  { id: "p10", sku: "PRT-USBC-X13P", name: "พอร์ตชาร์จ Xiaomi 13 Pro", category: "ports", compatible: ["Xiaomi 13 Pro"], stock: 0, minStock: 2, location: "C1-01", cost: 320, price: 690 },
  { id: "p11", sku: "PRT-LIGHT-IP14", name: "พอร์ต Lightning iPhone 14", category: "ports", compatible: ["iPhone 14", "iPhone 14 Plus"], stock: 6, minStock: 3, location: "C1-02", cost: 280, price: 590 },
  { id: "p12", sku: "PRT-USBC-S23U", name: "พอร์ตชาร์จ S23 Ultra", category: "ports", compatible: ["Galaxy S23 Ultra"], stock: 3, minStock: 2, location: "C1-03", cost: 220, price: 490 },
  { id: "p13", sku: "IC-PWR-S23U", name: "IC Power Galaxy S23 Ultra", category: "ics", compatible: ["Galaxy S23 Ultra"], stock: 7, minStock: 3, location: "D1-01", cost: 480, price: 850 },
  { id: "p14", sku: "IC-AUDIO-IP13", name: "IC Audio iPhone 13", category: "ics", compatible: ["iPhone 13", "iPhone 13 Pro"], stock: 2, minStock: 3, location: "D1-02", cost: 320, price: 620 },
  { id: "p15", sku: "IC-CHRG-IP14P", name: "IC Charge iPhone 14 Pro", category: "ics", compatible: ["iPhone 14 Pro"], stock: 5, minStock: 3, location: "D1-03", cost: 380, price: 690 },
  { id: "p16", sku: "CAM-IP14P-REAR", name: "กล้องหลัง iPhone 14 Pro", category: "cameras", compatible: ["iPhone 14 Pro"], stock: 2, minStock: 2, location: "E1-01", cost: 2400, price: 3600 },
  { id: "p17", sku: "CAM-V29-REAR", name: "กล้องหลัง Vivo V29", category: "cameras", compatible: ["Vivo V29"], stock: 1, minStock: 2, location: "E1-02", cost: 980, price: 1700 },
  { id: "p18", sku: "CAM-S23U-WIDE", name: "กล้อง Wide S23 Ultra", category: "cameras", compatible: ["Galaxy S23 Ultra"], stock: 0, minStock: 1, location: "E1-03", cost: 3200, price: 4800 },
  { id: "p19", sku: "FLEX-IP13-001", name: "แพรชาร์จ iPhone 13", category: "charging_flex", compatible: ["iPhone 13", "iPhone 13 mini"], stock: 4, minStock: 2, location: "C2-01", cost: 180, price: 390 },
  { id: "p20", sku: "FLEX-IP14P-001", name: "แพรชาร์จ iPhone 14 Pro", category: "charging_flex", compatible: ["iPhone 14 Pro"], stock: 2, minStock: 2, location: "C2-02", cost: 220, price: 490 },
  { id: "p21", sku: "BACK-IP12-001", name: "ฝาหลัง iPhone 12", category: "back_glass", compatible: ["iPhone 12"], stock: 3, minStock: 2, location: "F1-01", cost: 320, price: 690 },
  { id: "p22", sku: "BACK-IP13P-001", name: "ฝาหลัง iPhone 13 Pro", category: "back_glass", compatible: ["iPhone 13 Pro"], stock: 1, minStock: 2, location: "F1-02", cost: 380, price: 790 },
  { id: "p23", sku: "SW-PWR-S23U", name: "สวิตช์ Power Galaxy S23 Ultra", category: "switches", compatible: ["Galaxy S23 Ultra"], stock: 6, minStock: 3, location: "G1-01", cost: 90, price: 220 },
  { id: "p24", sku: "SW-VOL-IP14", name: "สวิตช์ Volume iPhone 14", category: "switches", compatible: ["iPhone 14", "iPhone 14 Plus"], stock: 4, minStock: 3, location: "G1-02", cost: 80, price: 190 },
  { id: "p25", sku: "GLUE-IP14PM-001", name: "กาวกันน้ำ iPhone 14 Pro Max", category: "adhesive", compatible: ["iPhone 14 Pro Max"], stock: 12, minStock: 5, location: "H1-01", cost: 35, price: 90 },
  { id: "p26", sku: "GLUE-UNIV-B7000", name: "กาว B-7000 อเนกประสงค์", category: "adhesive", compatible: ["ทุกรุ่น"], stock: 8, minStock: 3, location: "H1-02", cost: 60, price: 150 },
];


export const ACTIVITY: ActivityEntry[] = [
  { id: "a1", at: "14:20", type: "intake", text: "รับเครื่องใหม่ #RE-8847 (iPhone 11)", by: "คุณกานต์" },
  { id: "a2", at: "13:45", type: "complete", text: "ปิดงาน #RE-8839 (iPad Air 5)", by: "ช่างวิทย์" },
  { id: "a3", at: "13:20", type: "status", text: "อัปเดต #RE-8844 → กำลังซ่อม", by: "ช่างเอก" },
  { id: "a4", at: "12:10", type: "part", text: "เบิกอะไหล่: จอ iPhone 15 Pro x1", by: "ช่างเอก" },
  { id: "a5", at: "11:00", type: "intake", text: "รับเครื่องใหม่ #RE-8844 (iPhone 15 Pro Max)", by: "คุณกานต์" },
  { id: "a6", at: "10:35", type: "status", text: "อัปเดต #RE-8843 → กำลังซ่อม", by: "ช่างวิทย์" },
];

// Inject deterministic tracking codes + warranty days on every repair
REPAIRS.forEach((r) => {
  r.trackingCode = "FX-" + r.id.replace(/[^0-9]/g, "").slice(-5);
  if (r.warrantyDays === undefined) {
    r.warrantyDays = r.status === "completed" || r.status === "picked_up" ? 90 : 0;
  }
});

export const WARRANTIES: Warranty[] = [
  { id: "W-1001", repairId: "RE-8839", customerId: "c5", customerName: "คุณอารี โชคดี", phone: "086-712-3344", device: "iPad Air 5", partName: "แบตเตอรี่", startDate: "2025-06-11", endDate: "2025-09-09", days: 90, status: "active" },
  { id: "W-1002", repairId: "RE-8825", customerId: "c12", customerName: "คุณสุดา ทองคำ", phone: "081-228-3399", device: "iPhone 12", partName: "แบตเตอรี่", startDate: "2025-05-28", endDate: "2025-08-26", days: 90, status: "active" },
  { id: "W-1003", repairId: "RE-8846", customerId: "c9", customerName: "คุณธีรพล สุริยา", phone: "089-330-5577", device: "Galaxy A55", partName: "ลำโพง", startDate: "2025-06-09", endDate: "2025-09-07", days: 90, status: "active" },
  { id: "W-1004", repairId: "RE-8810", customerId: "c7", customerName: "คุณสมพงษ์ จันทร์เพ็ญ", phone: "081-902-1145", device: "Galaxy Note 20", partName: "หน้าจอ", startDate: "2025-03-18", endDate: "2025-06-16", days: 90, status: "expiring" },
  { id: "W-1005", repairId: "RE-8821", customerId: "c11", customerName: "คุณเอกชัย พัฒนา", phone: "093-665-1199", device: "iPhone 13 Pro Max", partName: "หน้าจอแท้", startDate: "2025-05-02", endDate: "2025-06-20", days: 49, status: "expiring" },
  { id: "W-1006", repairId: "RE-7901", customerId: "c1", customerName: "คุณอานนท์ รัตนชัย", phone: "081-442-2891", device: "iPhone 13 Pro", partName: "แบตเตอรี่", startDate: "2025-01-15", endDate: "2025-04-15", days: 90, status: "expired" },
  { id: "W-1007", repairId: "RE-7820", customerId: "c3", customerName: "คุณวิภาวดี แสงทอง", phone: "081-555-4567", device: "iPhone 14 Pro", partName: "พอร์ตชาร์จ", startDate: "2024-12-01", endDate: "2025-03-01", days: 90, status: "expired" },
  { id: "W-1008", repairId: "RE-8602", customerId: "c6", customerName: "คุณนิภา ปรีชา", phone: "098-441-2278", device: "OPPO Reno 10", partName: "หน้าจอ", startDate: "2025-04-12", endDate: "2025-07-11", days: 90, status: "claimed", claimNote: "เคลม: หน้าจอเป็นเส้น ภายใน 30 วัน — เปลี่ยนใหม่ฟรี" },
];

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  { id: "t1", label: "ซ่อมเสร็จ พร้อมรับ", channel: "line", body: "สวัสดีค่ะ คุณ{customer} เครื่อง {device} ซ่อมเสร็จเรียบร้อยแล้ว สามารถเข้ามารับได้เลยนะคะ ติดตามสถานะ: {url}" },
  { id: "t2", label: "รออะไหล่", channel: "line", body: "คุณ{customer} ขณะนี้ทางร้านกำลังสั่งอะไหล่สำหรับ {device} คาดว่าจะถึงภายใน 3-5 วันค่ะ ติดตาม: {url}" },
  { id: "t3", label: "แจ้งราคาประเมิน", channel: "line", body: "คุณ{customer} ประเมินค่าซ่อม {device} = {price} บาท กรุณายืนยันก่อนเริ่มซ่อมค่ะ {url}" },
  { id: "t4", label: "นัดรับเครื่อง (SMS)", channel: "sms", body: "FIXFLOW: คุณ{customer} เครื่อง {device} พร้อมรับ ที่ร้าน 10:00-20:00 ทุกวัน {url}" },
];
