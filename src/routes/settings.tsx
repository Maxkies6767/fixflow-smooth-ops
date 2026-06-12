import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, Store, Receipt, Smartphone, Plus, Trash2, RotateCcw, MessageSquareQuote, Clock, BarChart3, ChevronRight, Lock, Terminal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/fixflow/section";
import { StaffManager } from "@/components/fixflow/staff-manager";
import { useAuth } from "@/hooks/use-auth";
import {
  useDeviceCatalog,
  addBrand,
  removeBrand,
  addModel,
  removeModel,
  resetCatalog,
} from "@/mocks/device-catalog";
import { useShopSettings, updateShopSettings, type ShopSettings } from "@/mocks/shop-settings";
import {
  useSymptomTemplates,
  addSymptomTemplate,
  removeSymptomTemplate,
  resetSymptomTemplates,
} from "@/mocks/symptom-templates-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "ตั้งค่า · FIXFLOW" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(false);
  const { role, loading } = useAuth();
  const isOwner = role === "owner";
  const navigate = useNavigate();

  useEffect(() => {
    const html = document.documentElement;
    if (dark) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    if (!loading && !isOwner) {
      toast.error("เฉพาะเจ้าของร้านเท่านั้นที่เข้าถึงหน้านี้ได้");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, isOwner, navigate]);

  if (loading) {
    return <div className="min-h-[50vh] grid place-items-center text-muted-foreground text-sm">กำลังโหลด…</div>;
  }
  if (!isOwner) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto mb-3">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-xs text-muted-foreground mt-1">หน้านี้สำหรับเจ้าของร้านเท่านั้น</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-4xl mx-auto">
      <PageHeader title="ตั้งค่า" subtitle="จัดการข้อมูลร้าน พนักงาน และธีม" />

      <div className="space-y-6">
        <ShopAndReceiptSection />

        <Section icon={BarChart3} title="รายงานและสรุปยอด">
          <Link
            to="/reports"
            className="flex items-center gap-3 rounded-xl bg-card ring-1 ring-border p-3 hover:ring-brand transition"
          >
            <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center shrink-0">
              <BarChart3 className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">เปิดหน้ารายงาน</p>
              <p className="text-xs text-muted-foreground truncate">Dashboard ยอดขาย · กำไรช่าง · Export CSV / Excel</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </Link>
        </Section>

        <Section icon={Terminal} title="Activity Logs">
          <Link
            to="/logs"
            className="flex items-center gap-3 rounded-xl bg-card ring-1 ring-border p-3 hover:ring-brand transition"
          >
            <div className="size-10 rounded-lg bg-zinc-900 text-emerald-400 grid place-items-center shrink-0">
              <Terminal className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">เปิด Activity Terminal</p>
              <p className="text-xs text-muted-foreground truncate">ดูประวัติทุกการเพิ่ม/ลบ/แก้ไข/เบิก แบบเรียลไทม์</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </Link>
        </Section>

        <DeviceCatalogSection />
        <SymptomTemplatesSection />

        <Section icon={dark ? Moon : Sun} title="ธีม">
          <div className="flex gap-2">
            <button
              onClick={() => setDark(false)}
              className={cn("flex-1 rounded-xl ring-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2",
                !dark ? "bg-brand/10 text-brand ring-brand" : "bg-card text-muted-foreground ring-border")}
            >
              <Sun className="size-4" /> สว่าง
            </button>
            <button
              onClick={() => setDark(true)}
              className={cn("flex-1 rounded-xl ring-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2",
                dark ? "bg-brand/10 text-brand ring-brand" : "bg-card text-muted-foreground ring-border")}
            >
              <Moon className="size-4" /> มืด
            </button>
          </div>
        </Section>

        <StaffManager />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Store; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="size-4 text-brand" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        {...rest}
        className="w-full rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px]"
      />
    </label>
  );
}

type SaveStatus = "idle" | "saving" | "saved";

function useAutoSave(
  buffer: Partial<ShopSettings>,
  saved: ShopSettings,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const dirty = (Object.keys(buffer) as (keyof typeof buffer)[]).some(
    (k) => buffer[k] !== undefined && buffer[k] !== saved[k],
  );
  useEffect(() => {
    if (!dirty) return;
    setStatus("saving");
    const t = setTimeout(() => {
      updateShopSettings(buffer);
      setStatus("saved");
      const t2 = setTimeout(() => setStatus("idle"), 1500);
      return () => clearTimeout(t2);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(buffer)]);
  return status;
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        status === "saving" ? "text-muted-foreground" : "text-emerald-600",
      )}
    >
      {status === "saving" ? (
        <>
          <span className="size-1.5 rounded-full bg-current animate-pulse" />
          กำลังบันทึก…
        </>
      ) : (
        <>✓ บันทึกแล้ว</>
      )}
    </span>
  );
}

function ShopAndReceiptSection() {
  const saved = useShopSettings();
  const [buffer, setBuffer] = useState(saved);

  // Reset buffer when external changes happen (e.g. reset elsewhere)
  useEffect(() => {
    setBuffer(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.name, saved.branch, saved.phone, saved.taxId, saved.address, saved.receiptHeader, saved.receiptFooter]);

  const status = useAutoSave(buffer, saved);
  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) =>
    setBuffer((b: ShopSettings) => ({ ...b, [k]: v }));

  const saveNow = () => {
    updateShopSettings(buffer);
    toast.success("บันทึกข้อมูลร้านและใบเสร็จแล้ว");
  };

  return (
    <>
      <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-brand" />
            <h2 className="text-sm font-semibold">ข้อมูลร้านค้า</h2>
          </div>
          <SaveBadge status={status} />
        </div>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <ControlledField label="ชื่อร้าน" value={buffer.name} onChange={(v) => set("name", v)} />
            <ControlledField label="สาขา" value={buffer.branch} onChange={(v) => set("branch", v)} />
            <ControlledField label="เบอร์โทร" value={buffer.phone} onChange={(v) => set("phone", v)} />
            <ControlledField label="เลขประจำตัวผู้เสียภาษี" value={buffer.taxId} onChange={(v) => set("taxId", v)} />
          </div>
          <ControlledField label="ที่อยู่" value={buffer.address} onChange={(v) => set("address", v)} />
          <label className="block sm:max-w-xs">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5 inline-flex items-center gap-1">
              <Clock className="size-3" /> อัตราค่าแรง (บาท/ชม.)
            </span>
            <input
              type="number"
              min={0}
              step={10}
              value={buffer.laborRatePerHour}
              onChange={(e) => set("laborRatePerHour", Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px]"
            />
          </label>
        </div>
      </section>

      <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-brand" />
            <h2 className="text-sm font-semibold">ตั้งค่าใบเสร็จ</h2>
          </div>
          <SaveBadge status={status} />
        </div>
        <div className="space-y-3">
          <ControlledField
            label="หัวเรื่องใบเสร็จ"
            value={buffer.receiptHeader}
            onChange={(v) => set("receiptHeader", v)}
          />
          <ControlledField
            label="ข้อความท้ายใบเสร็จ"
            value={buffer.receiptFooter}
            onChange={(v) => set("receiptFooter", v)}
          />
          <button
            type="button"
            onClick={saveNow}
            className="w-full sm:w-auto rounded-xl bg-brand text-brand-foreground px-5 h-11 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90"
          >
            บันทึกทันที
          </button>
          <p className="text-[11px] text-muted-foreground">
            ระบบจะบันทึกอัตโนมัติหลังหยุดพิมพ์ · ค่าเหล่านี้ถูกใช้ในใบเสร็จ 80mm ทุกใบ
          </p>
        </div>
      </section>
    </>
  );
}

function ControlledField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px]"
      />
    </label>
  );
}

function DeviceCatalogSection() {
  const catalog = useDeviceCatalog();
  const brands = useMemo(() => Object.keys(catalog), [catalog]);
  const [selected, setSelected] = useState<string | null>(brands[0] ?? null);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");

  const activeBrand = selected && brands.includes(selected) ? selected : brands[0] ?? null;
  const models = activeBrand ? catalog[activeBrand] ?? [] : [];

  const handleAddBrand = () => {
    const v = newBrand.trim();
    if (!v) return;
    const k = addBrand(v);
    if (k) {
      toast.success(`เพิ่มยี่ห้อ "${k}" แล้ว`);
      setSelected(k);
      setNewBrand("");
    }
  };

  const handleRemoveBrand = (b: string) => {
    if (!confirm(`ลบยี่ห้อ "${b}" และทุกรุ่น?`)) return;
    if (removeBrand(b)) {
      toast.success(`ลบยี่ห้อ "${b}" แล้ว`);
      if (selected === b) setSelected(null);
    } else {
      toast.error("ต้องเหลืออย่างน้อย 1 ยี่ห้อ");
    }
  };

  const handleAddModel = () => {
    if (!activeBrand) return;
    const v = newModel.trim();
    if (!v) return;
    if (addModel(activeBrand, v)) {
      toast.success(`เพิ่มรุ่น "${v}" แล้ว`);
      setNewModel("");
    } else {
      toast.error("มีรุ่นนี้อยู่แล้ว");
    }
  };

  const handleReset = () => {
    if (!confirm("รีเซ็ตแคตตาล็อกกลับเป็นค่าเริ่มต้น?")) return;
    resetCatalog();
    toast.success("รีเซ็ตแคตตาล็อกแล้ว");
  };

  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-brand" />
          <h2 className="text-sm font-semibold">แคตตาล็อกอุปกรณ์</h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 min-h-[36px]"
        >
          <RotateCcw className="size-3" /> รีเซ็ต
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground mb-4">
        เพิ่ม/ลบยี่ห้อและรุ่นที่ใช้ในหน้ารับเครื่อง · บันทึกในเครื่องนี้
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Brands */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">ยี่ห้อ ({brands.length})</p>
          <ul className="divide-y divide-border rounded-xl ring-1 ring-border bg-background overflow-hidden max-h-72 overflow-y-auto">
            {brands.map((b) => {
              const active = b === activeBrand;
              return (
                <li key={b} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className={cn(
                      "flex-1 text-left px-3 min-h-[44px] text-sm font-medium",
                      active ? "bg-brand/10 text-brand" : "hover:bg-muted",
                    )}
                  >
                    {b}
                    <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                      {(catalog[b] ?? []).length} รุ่น
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBrand(b)}
                    className="size-10 grid place-items-center text-muted-foreground hover:text-rose-600"
                    aria-label={`ลบ ${b}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBrand())}
              placeholder="ยี่ห้อใหม่ เช่น Nothing"
              className="flex-1 rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-3 h-11 text-sm"
            />
            <button
              type="button"
              onClick={handleAddBrand}
              className="inline-flex items-center gap-1 rounded-xl bg-brand text-brand-foreground px-3 h-11 text-sm font-semibold"
            >
              <Plus className="size-4" /> เพิ่ม
            </button>
          </div>
        </div>

        {/* Models */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            รุ่น {activeBrand ? `· ${activeBrand}` : ""} ({models.length})
          </p>
          <ul className="divide-y divide-border rounded-xl ring-1 ring-border bg-background overflow-hidden max-h-72 overflow-y-auto">
            {models.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">ยังไม่มีรุ่น</li>
            )}
            {models.map((m) => (
              <li key={m} className="flex items-center">
                <span className="flex-1 px-3 min-h-[44px] flex items-center text-sm">{m}</span>
                <button
                  type="button"
                  onClick={() => activeBrand && removeModel(activeBrand, m) && toast.success("ลบรุ่นแล้ว")}
                  className="size-10 grid place-items-center text-muted-foreground hover:text-rose-600"
                  aria-label={`ลบ ${m}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddModel())}
              disabled={!activeBrand}
              placeholder={activeBrand ? `รุ่นใหม่ของ ${activeBrand}` : "เลือกยี่ห้อก่อน"}
              className="flex-1 rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-3 h-11 text-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleAddModel}
              disabled={!activeBrand}
              className="inline-flex items-center gap-1 rounded-xl bg-brand text-brand-foreground px-3 h-11 text-sm font-semibold disabled:opacity-50"
            >
              <Plus className="size-4" /> เพิ่ม
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SymptomTemplatesSection() {
  const templates = useSymptomTemplates();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");

  const handleAdd = () => {
    const t = text.trim();
    if (!t) return;
    addSymptomTemplate(t, category.trim() || undefined);
    setText("");
    setCategory("");
    toast.success("เพิ่มเทมเพลตอาการแล้ว");
  };

  const handleReset = () => {
    if (!confirm("รีเซ็ตเทมเพลตอาการกลับเป็นค่าเริ่มต้น?")) return;
    resetSymptomTemplates();
    toast.success("รีเซ็ตแล้ว");
  };

  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="size-4 text-brand" />
          <h2 className="text-sm font-semibold">เทมเพลตอาการเสีย ({templates.length})</h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 min-h-[36px]"
        >
          <RotateCcw className="size-3" /> รีเซ็ต
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground mb-4">
        ใช้ตอนรับเครื่อง — กดเลือกเพื่อใส่ลงช่อง “อาการเสีย” อัตโนมัติ
      </p>

      <ul className="divide-y divide-border rounded-xl ring-1 ring-border bg-background overflow-hidden max-h-72 overflow-y-auto mb-3">
        {templates.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">ยังไม่มีเทมเพลต</li>
        )}
        {templates.map((t) => (
          <li key={t.id} className="flex items-center gap-2 px-3 min-h-[44px]">
            {t.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand shrink-0">
                {t.category}
              </span>
            )}
            <span className="flex-1 text-sm truncate">{t.text}</span>
            <button
              type="button"
              onClick={() => {
                removeSymptomTemplate(t.id);
                toast.success("ลบเทมเพลตแล้ว");
              }}
              className="size-9 grid place-items-center text-muted-foreground hover:text-rose-600 shrink-0"
              aria-label="ลบ"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="grid sm:grid-cols-[140px,1fr,auto] gap-2">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="หมวด (ไม่บังคับ)"
          className="rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-3 h-11 text-sm"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder="เช่น หน้าจอแตก ทัชไม่ติด"
          className="rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-3 h-11 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-xl bg-brand text-brand-foreground px-3 h-11 text-sm font-semibold"
        >
          <Plus className="size-4" /> เพิ่ม
        </button>
      </div>
    </section>
  );
}
