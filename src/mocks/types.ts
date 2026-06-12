export type RepairStatus =
  | "received"
  | "diagnosing"
  | "waiting_parts"
  | "repairing"
  | "completed"
  | "picked_up"
  | "canceled";

export const STATUS_LABEL: Record<RepairStatus, string> = {
  received: "รับเครื่องแล้ว",
  diagnosing: "กำลังตรวจเช็ก",
  waiting_parts: "รออะไหล่",
  repairing: "กำลังซ่อม",
  completed: "ซ่อมเสร็จ",
  picked_up: "ลูกค้ารับเครื่องแล้ว",
  canceled: "ยกเลิก",
};

export type ConditionFlag =
  | "screen_cracked"
  | "bent_body"
  | "scratches"
  | "water_damage"
  | "no_power"
  | "no_case"
  | "no_sim_tray"
  | "missing_screws"
  | "swollen_battery"
  | "no_switch";

export const CONDITION_LABEL: Record<ConditionFlag, string> = {
  screen_cracked: "จอแตก",
  bent_body: "บอดี้งอ",
  scratches: "มีรอยขีดข่วน",
  water_damage: "โดนน้ำ",
  no_power: "เปิดไม่ติด",
  no_case: "ไม่มีเคส",
  no_sim_tray: "ไม่มีถาดซิม",
  missing_screws: "น็อตไม่ครบ",
  swollen_battery: "แบตบวม",
  no_switch: "ไม่มีสวิตช์",
};

export interface Repair {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  brand: string;
  model: string;
  imei: string;
  problem: string;
  status: RepairStatus;
  createdAt: string;
  updatedAt: string;
  technician: string;
  estimatedPrice: number;
  deposit: number;
  conditions: ConditionFlag[];
  partsUsed: { partId?: string; sku?: string; name: string; qty: number; price: number }[];
  notes: { at: string; by: string; text: string }[];
  ageDays: number;
  trackingCode?: string;
  warrantyDays?: number;
  lastNotification?: {
    channel: "line" | "sms";
    template: string;
    at: string;
  };
  /** ภาพถ่ายสภาพเครื่อง (data URL) */
  photos?: string[];
  /** อุปกรณ์ที่มากับเครื่อง */
  accessories?: string[];
  /** รหัสปลดล็อก / Apple ID (เก็บแบบสรุป ไม่แสดงในหน้าเปิดทั่วไป) */
  unlockInfo?: string;
  /** ลายเซ็นลูกค้า (data URL) */
  signature?: string;
  /** เซสชันการทำงานของช่าง (จับเวลา) */
  workSessions?: { id: string; start: string; end?: string; by?: string }[];
  /** อัตราค่าแรง บาท/ชม. (ถ้าไม่กำหนด ใช้ค่า default ของร้าน) */
  laborRatePerHour?: number;
  /** โหมดรอรับเครื่อง — ลูกค้านั่งรอที่ร้าน */
  isWalkIn?: boolean;
}

export type WarrantyStatus = "active" | "expiring" | "expired" | "claimed";

export const WARRANTY_STATUS_LABEL: Record<WarrantyStatus, string> = {
  active: "อยู่ในประกัน",
  expiring: "ใกล้หมดอายุ",
  expired: "หมดประกัน",
  claimed: "เคลมแล้ว",
};

export interface Warranty {
  id: string;
  repairId: string;
  customerId: string;
  customerName: string;
  phone: string;
  device: string;
  partName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: WarrantyStatus;
  claimNote?: string;
}

export interface NotificationTemplate {
  id: string;
  label: string;
  channel: "line" | "sms";
  body: string;
}


export interface Customer {
  id: string;
  name: string;
  phone: string;
  lineId?: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
  note?: string;
}

export type PartCategory =
  | "screens"
  | "batteries"
  | "ports"
  | "ics"
  | "cameras"
  | "charging_flex"
  | "back_glass"
  | "switches"
  | "adhesive";

export const CATEGORY_LABEL: Record<PartCategory, string> = {
  screens: "หน้าจอ",
  batteries: "แบตเตอรี่",
  ports: "พอร์ตชาร์จ",
  ics: "ชิป / IC",
  cameras: "กล้อง",
  charging_flex: "แพรชาร์จ",
  back_glass: "ฝาหลัง",
  switches: "สวิตช์ / ปุ่ม",
  adhesive: "กาว / เทปกันน้ำ",
};


export interface Part {
  id: string;
  sku: string;
  name: string;
  category: PartCategory;
  model?: string;
  variant?: string;



  compatible: string[];
  stock: number;
  minStock: number;
  location: string;
  cost: number;
  price: number;
}


export type Role = "OWNER" | "TECHNICIAN" | "ADMIN";

export interface Staff {
  id: string;
  name: string;
  role: Role;
  initials: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  type: "intake" | "status" | "part" | "complete";
  text: string;
  by: string;
}
