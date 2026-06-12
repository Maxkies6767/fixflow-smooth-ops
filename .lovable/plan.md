## ย้าย Activity Logs → Lovable Cloud (ถาวร ข้ามอุปกรณ์)

### 1. สร้างตาราง `activity_logs` ใน Cloud
คอลัมน์: `id` (uuid), `at` (timestamptz), `actor_id` (uuid, nullable), `actor_name` (text), `level` (text), `category` (text), `message` (text), `ref_id` (text, nullable)

- Index: `(at DESC)`, `(category)`, `(level)` — ดึงเร็ว
- RLS:
  - `authenticated` INSERT ได้ทุกคน (log การกระทำตัวเอง)
  - **owner เท่านั้น** SELECT/DELETE (เหมือนหน้า /logs ปัจจุบัน)
- GRANT: `authenticated` (SELECT/INSERT/DELETE), `service_role` (ALL)

### 2. Auto-cleanup 90 วัน
- เพิ่ม function `purge_old_activity_logs()` ลบ record ที่ `at < now() - interval '90 days'`
- เรียกอัตโนมัติทุกครั้งที่หน้า `/logs` โหลด (lazy cleanup, ไม่ต้องใช้ pg_cron)

### 3. แก้ `src/mocks/activity-log-store.ts`
- `logActivity()` → insert ลง Supabase (fire-and-forget, ไม่ block UI)
- `useActivityLog()` → query 500 รายการล่าสุด ผ่าน TanStack Query + **realtime subscription** (เห็น log ใหม่ทันทีข้ามอุปกรณ์/แท็บ)
- `clearActivityLog()` → DELETE ทั้งหมด (owner เท่านั้น)
- ลบโค้ดที่อ่าน/เขียน localStorage ออก

### 4. Migration ข้อมูลเก่าจาก localStorage → Cloud
- เมื่อหน้า `/logs` โหลดครั้งแรกหลัง deploy:
  - ตรวจ `localStorage["fixflow.activity.v1"]`
  - ถ้ามี → bulk insert ขึ้น Cloud → ลบออกจาก localStorage → toast "อัปโหลดประวัติเก่า N รายการแล้ว"
- ทำครั้งเดียว ไม่ทำซ้ำ

### 5. อัปเดตหน้า `/logs`
- เปลี่ยน source จาก localStorage hook → Supabase query
- ปุ่ม "ล้าง" ยังทำงาน (DELETE ผ่าน RLS owner)
- Export .txt ยังใช้ได้ (export จาก data ที่ดึงมา)

### ไฟล์ที่แก้
- **migration ใหม่**: ตาราง + policies + grants + function `purge_old_activity_logs`
- `src/mocks/activity-log-store.ts` — เปลี่ยนเป็น Supabase-backed
- `src/routes/logs.tsx` — ใช้ store ใหม่ + เรียก migration ครั้งแรก
- จุดที่เรียก `logActivity()` (repairs/parts/customers/warranty/staff/auth) — **ไม่ต้องแก้** เพราะ signature เหมือนเดิม

### พื้นที่ที่ใช้
ร้านทั่วไป ~50 actions/วัน × 90 วัน = 4,500 records ≈ **2 MB** (จากโควต้า 500 MB)
