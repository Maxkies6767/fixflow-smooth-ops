import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, X, Check, Plus, Smartphone, Search } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_LABEL, type PartCategory, type Part } from "@/mocks/types";
import { isSkuTaken, generateSku, CATEGORY_PREFIX } from "@/mocks/parts-store";
import {
  useLocations,
  addLocation as addLoc,
  removeLocation,
  renameLocation,
} from "@/mocks/locations-store";
import {
  useVariantOptions,
  VARIANT_LABEL,
  hasVariant,
  addVariantOption,
  renameVariantOption,
  removeVariantOption,
} from "@/mocks/variants-store";
import { useDeviceCatalog, addModel as catalogAddModel } from "@/mocks/device-catalog";
import { cn } from "@/lib/utils";
import { CompatibleModelsPicker } from "./compatible-models-picker";
import { BarcodeSvg, QrSvg } from "./part-codes";


const CATEGORIES: PartCategory[] = [
  "screens", "batteries", "ports", "ics", "cameras",
  "charging_flex", "back_glass", "switches", "adhesive",
];

const PRICE_PRESETS: Record<PartCategory, number[]> = {
  screens: [1900, 3800, 5800, 7500, 9800],
  batteries: [690, 990, 1100, 1400, 2200],
  ports: [290, 490, 590, 690],
  ics: [380, 620, 690, 850],
  cameras: [1700, 2400, 3600, 4800],
  charging_flex: [290, 390, 490, 690],
  back_glass: [490, 690, 790, 990],
  switches: [90, 150, 190, 250],
  adhesive: [60, 90, 120, 150],
};

const LOCATION_ZONE: Record<PartCategory, string> = {
  screens: "A1", batteries: "B1", ports: "C1", ics: "D1", cameras: "E1",
  charging_flex: "C2", back_glass: "F1", switches: "G1", adhesive: "H1",
};

export interface PartFormValues {
  name: string;
  category: PartCategory;
  sku: string;
  model: string;
  variant: string;
  compatible: string;
  location: string;
  cost: string;
  price: string;
  stock: string;
  minStock: string;
}

export const emptyForm: PartFormValues = {
  name: "",
  category: "screens",
  sku: "",
  model: "",
  variant: "",
  compatible: "",
  location: "",
  cost: "",
  price: "",
  stock: "",
  minStock: "",
};

export const partToForm = (p: Part): PartFormValues => ({
  name: p.name,
  category: p.category,
  sku: p.sku,
  model: p.model ?? p.compatible[0] ?? "",
  variant: p.variant ?? "",
  compatible: p.compatible.join(", "),
  location: p.location,
  cost: String(p.cost),
  price: String(p.price),
  stock: String(p.stock),
  minStock: String(p.minStock),
});

export type FieldErrors = Partial<Record<keyof PartFormValues, string>>;

export function validatePartForm(f: PartFormValues, excludeId?: string): FieldErrors {
  const e: FieldErrors = {};
  if (!f.name.trim()) e.name = "กรุณากรอกชื่ออะไหล่";
  if (!f.sku.trim()) e.sku = "กรุณากรอก SKU";
  else if (isSkuTaken(f.sku, excludeId)) e.sku = "SKU นี้ถูกใช้แล้ว";
  if (hasVariant(f.category) && !f.variant.trim()) {
    e.variant = `กรุณาเลือก${VARIANT_LABEL[f.category]}`;
  }

  const num = (v: string) => {
    if (v.trim() === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };
  const checkNonNeg = (k: keyof PartFormValues, label: string) => {
    const n = num(f[k]);
    if (Number.isNaN(n)) e[k] = `${label} ต้องเป็นตัวเลข`;
    else if (n < 0) e[k] = `${label} ต้องไม่ติดลบ`;
  };
  checkNonNeg("cost", "ราคาทุน");
  checkNonNeg("price", "ราคาขาย");
  checkNonNeg("stock", "จำนวนคงเหลือ");
  checkNonNeg("minStock", "สต็อกขั้นต่ำ");
  return e;
}

export function formToPart(f: PartFormValues): Omit<Part, "id"> {
  return {
    name: f.name.trim(),
    category: f.category,
    sku: f.sku.trim(),
    model: f.model.trim(),
    variant: f.variant.trim() || undefined,
    compatible: f.compatible.split(",").map((s) => s.trim()).filter(Boolean),
    location: f.location.trim(),
    cost: Number(f.cost) || 0,
    price: Number(f.price) || 0,
    stock: Number(f.stock) || 0,
    minStock: Number(f.minStock) || 0,
  };
}


export function PartFormFields({
  value,
  onChange,
  errors,
  excludeId,
  autoSku = true,
}: {
  value: PartFormValues;
  onChange: (next: PartFormValues) => void;
  errors: FieldErrors;
  excludeId?: string;
  autoSku?: boolean;
}) {
  const set = <K extends keyof PartFormValues>(k: K, v: PartFormValues[K]) =>
    onChange({ ...value, [k]: v });

  const priceOptions = PRICE_PRESETS[value.category] ?? [];
  const zone = LOCATION_ZONE[value.category];
  const allLocations = useLocations();

  // Auto-fill model from first compatible when empty
  useEffect(() => {
    if (value.model.trim()) return;
    const first = value.compatible.split(",").map((s) => s.trim()).filter(Boolean)[0];
    if (first) set("model", first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.compatible]);

  // Auto-sync SKU
  const skuTouchedRef = useRef(false);
  const lastAutoRef = useRef(value.sku);
  useEffect(() => {
    if (!autoSku || skuTouchedRef.current) return;
    if (!value.name.trim() && !value.model.trim()) return;
    const next = generateSku(value.category, value.model, value.name, excludeId, value.variant);
    if (next !== value.sku) {
      lastAutoRef.current = next;
      onChange({ ...value, sku: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.category, value.model, value.name, value.variant, autoSku]);


  const onSkuChange = (v: string) => {
    if (v !== lastAutoRef.current) skuTouchedRef.current = true;
    set("sku", v);
  };

  return (
    <div className="space-y-3">
      <Field
        label="ชื่ออะไหล่ *"
        value={value.name}
        onChange={(v) => set("name", v)}
        placeholder="เช่น จอ iPhone 13 (LCD)"
        error={errors.name}
      />

      <div className="block">
        <span className="block text-xs font-medium text-muted-foreground mb-1.5">หมวดหมู่ *</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const on = value.category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => set("category", c)}
                className={cn(
                  "rounded-xl px-2 min-h-[44px] text-xs font-medium ring-1 transition-colors",
                  on
                    ? "bg-brand text-brand-foreground ring-brand"
                    : "bg-card text-muted-foreground ring-border hover:text-foreground",
                )}
              >
                {CATEGORY_LABEL[c]}
              </button>
            );
          })}
        </div>
      </div>

      <VariantPicker
        category={value.category}
        value={value.variant}
        onChange={(v) => set("variant", v)}
        error={errors.variant}
      />

      <ModelAutocomplete
        value={value.model}
        onChange={(v) => set("model", v)}
      />


      <CompatibleModelsPicker
        value={value.compatible}
        onChange={(v) => set("compatible", v)}
      />

      {/* SKU + live Barcode + QR */}
      <div>
        <Field
          label="SKU / Barcode * (สร้างให้อัตโนมัติ)"
          value={value.sku}
          onChange={onSkuChange}
          placeholder={`เช่น ${CATEGORY_PREFIX[value.category]}-IP13-001`}
          autoCapitalize="characters"
          error={errors.sku}
        />
        {value.sku.trim() && (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-muted/40 ring-1 ring-border p-3">
            <QrSvg value={value.sku.trim()} size={88} />
            <div className="flex-1 min-w-0">
              <BarcodeSvg value={value.sku.trim()} height={50} />
            </div>
          </div>
        )}
      </div>

      <LocationField
        value={value.location}
        onChange={(v) => set("location", v)}
        zone={zone}
        allLocations={allLocations}
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="ราคาทุน (฿)" value={value.cost} onChange={(v) => set("cost", v)} type="number" inputMode="decimal" min={0} placeholder="0" error={errors.cost} />
        <div>
          <Field label="ราคาขาย (฿)" value={value.price} onChange={(v) => set("price", v)} type="number" inputMode="decimal" min={0} placeholder="0" error={errors.price} />
          {priceOptions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {priceOptions.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const patch: Partial<PartFormValues> = { price: String(p) };
                    if (!value.cost.trim()) patch.cost = String(Math.round((p * 0.6) / 10) * 10);
                    onChange({ ...value, ...patch });
                  }}
                  className={cn(
                    "rounded-full px-2.5 min-h-[32px] text-[11px] font-medium ring-1 transition-colors tabular-nums",
                    value.price === String(p)
                      ? "bg-foreground text-background ring-foreground"
                      : "bg-card text-muted-foreground ring-border hover:text-foreground",
                  )}
                >
                  ฿{p.toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="จำนวนคงเหลือ" value={value.stock} onChange={(v) => set("stock", v)} type="number" inputMode="numeric" min={0} placeholder="0" error={errors.stock} />
        <Field label="สต็อกขั้นต่ำ" value={value.minStock} onChange={(v) => set("minStock", v)} type="number" inputMode="numeric" min={0} placeholder="0" error={errors.minStock} />
      </div>
    </div>
  );
}

// ---------- Model autocomplete (single value) ----------

const QUICK_BRANDS = ["Apple", "Samsung", "Xiaomi", "OPPO", "Vivo", "realme"];

function ModelAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const catalog = useDeviceCatalog();
  const brands = useMemo(() => Object.keys(catalog), [catalog]);
  const [focus, setFocus] = useState(false);
  const [addBrand, setAddBrandState] = useState<string>("Apple");

  const q = value.trim().toLowerCase();
  const matches = useMemo<{ b: string; m: string }[]>(() => {
    const all = brands.flatMap((b) => (catalog[b] ?? []).map((m) => ({ b, m })));
    const filtered = q ? all.filter((x) => x.m.toLowerCase().includes(q) || x.b.toLowerCase().includes(q)) : all;
    return filtered.slice(0, 8);
  }, [brands, catalog, q]);

  const exact = q
    ? brands.some((b) => (catalog[b] ?? []).some((m) => m.toLowerCase() === q))
    : true;

  const handleAddNew = () => {
    const name = value.trim();
    if (!name) return;
    catalogAddModel(addBrand, name);
    toast.success(`เพิ่มรุ่น "${name}" ให้ ${addBrand} แล้ว`);
    setFocus(false);
  };

  return (
    <div className="block min-w-0 relative">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">รุ่น (Model) *</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 180)}
        placeholder="เช่น iPhone 13, Galaxy S23 Ultra"
        className="w-full rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-4 min-h-[44px] text-[15px]"
      />
      {focus && (matches.length > 0 || (q && !exact)) && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl bg-card ring-1 ring-border shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border text-[11px] text-muted-foreground">
            <Search className="size-3" /> รุ่นหลัก — ใช้สำหรับ SKU และค้นหา
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {matches.map(({ b, m }) => (
              <li key={`${b}-${m}`}>
                <button
                  type="button"
                  onMouseDown={() => { onChange(m); setFocus(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors min-h-[44px]"
                >
                  <span className="size-8 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">
                    <Smartphone className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{m}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{b}</span>
                  </span>
                </button>
              </li>
            ))}
            {q && !exact && (
              <li className="border-t border-border mt-1 pt-2 px-3 pb-2 space-y-2">
                <div className="text-[11px] text-muted-foreground">เพิ่ม "{value.trim()}" เป็นรุ่นใหม่</div>
                <div className="flex gap-2">
                  <select
                    value={addBrand}
                    onChange={(e) => setAddBrandState(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="rounded-lg bg-background ring-1 ring-border px-2 min-h-[40px] text-xs"
                  >
                    {QUICK_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    {brands.filter((b) => !QUICK_BRANDS.includes(b)).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onMouseDown={handleAddNew}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand text-brand-foreground min-h-[40px] text-xs font-semibold"
                  >
                    <Plus className="size-3.5" /> เพิ่ม
                  </button>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Location field with managed chips ----------

function LocationField({
  value, onChange, zone, allLocations,
}: {
  value: string;
  onChange: (v: string) => void;
  zone: string;
  allLocations: string[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Suggestion chips: saved locations in this zone + first 2 free slots in zone
  const inZone = allLocations.filter((l) => l.startsWith(`${zone}-`));
  const usedNums = new Set<number>();
  for (const l of allLocations) {
    if (!l.startsWith(`${zone}-`)) continue;
    const n = parseInt(l.slice(zone.length + 1), 10);
    if (Number.isFinite(n)) usedNums.add(n);
  }
  const freeSlots: string[] = [];
  let n = 1;
  while (freeSlots.length < 2 && n < 99) {
    if (!usedNums.has(n)) freeSlots.push(`${zone}-${String(n).padStart(2, "0")}`);
    n += 1;
  }
  const chips = Array.from(new Set([...inZone, ...freeSlots]));

  const trimmed = value.trim();
  const canSaveCurrent = trimmed && !allLocations.includes(trimmed);

  const startEdit = (code: string) => {
    setEditing(code);
    setEditText(code);
  };
  const commitEdit = () => {
    if (!editing) return;
    const n2 = editText.trim();
    if (n2 && n2 !== editing) {
      renameLocation(editing, n2);
      if (value === editing) onChange(n2);
      toast.success(`เปลี่ยน "${editing}" → "${n2}"`);
    }
    setEditing(null);
  };

  return (
    <div>
      <label className="block min-w-0">
        <span className="block text-xs font-medium text-muted-foreground mb-1.5">ตำแหน่งจัดเก็บ</span>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={chips[0] ?? `${zone}-01`}
            className="flex-1 min-w-0 rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-4 min-h-[44px] text-[15px]"
          />
          {canSaveCurrent && (
            <button
              type="button"
              onClick={() => { addLoc(trimmed); toast.success(`บันทึก "${trimmed}" แล้ว`); }}
              className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-brand/10 text-brand ring-1 ring-brand/30 px-3 min-h-[44px] text-xs font-semibold"
            >
              <Plus className="size-3.5" /> บันทึก
            </button>
          )}
        </div>
      </label>

      {chips.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chips.map((loc) => {
            const isSaved = allLocations.includes(loc);
            const isActive = value === loc;
            if (editing === loc) {
              return (
                <span key={loc} className="inline-flex items-center gap-1 rounded-full bg-card ring-1 ring-brand px-2 h-8">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
                    autoFocus
                    className="w-20 bg-transparent outline-none text-[11px] font-medium"
                  />
                  <button type="button" onClick={commitEdit} className="size-5 grid place-items-center text-brand">
                    <Check className="size-3" />
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="size-5 grid place-items-center text-muted-foreground">
                    <X className="size-3" />
                  </button>
                </span>
              );
            }
            return (
              <span
                key={loc}
                className={cn(
                  "inline-flex items-center rounded-full ring-1 transition-colors h-8 pl-2.5",
                  isActive
                    ? "bg-foreground text-background ring-foreground"
                    : "bg-card text-muted-foreground ring-border",
                  isSaved ? "pr-1" : "pr-2.5",
                )}
              >
                <button
                  type="button"
                  onClick={() => onChange(loc)}
                  className="text-[11px] font-medium tabular-nums"
                >
                  {loc}
                  {!isSaved && <span className="ml-1 opacity-60">ว่าง</span>}
                </button>
                {isSaved && (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(loc)}
                      aria-label={`แก้ไข ${loc}`}
                      className={cn("ml-1 size-5 grid place-items-center rounded-full hover:bg-black/10 dark:hover:bg-white/10", isActive && "text-background")}
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeLocation(loc);
                        if (value === loc) onChange("");
                        toast.success(`ลบ "${loc}" แล้ว`);
                      }}
                      aria-label={`ลบ ${loc}`}
                      className={cn("size-5 grid place-items-center rounded-full hover:bg-black/10 dark:hover:bg-white/10", isActive && "text-background")}
                    >
                      <X className="size-3" />
                    </button>
                  </>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, error, ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-xl bg-background ring-1 outline-none px-4 min-h-[44px] text-[15px]",
          error ? "ring-critical focus:ring-critical" : "ring-border focus:ring-brand",
        )}
      />
      {error && <span className="mt-1 block text-[11px] font-medium text-critical">{error}</span>}
    </label>
  );
}

// ---------- Variant picker (per-category options) ----------

function VariantPicker({
  category,
  value,
  onChange,
  error,
}: {
  category: PartCategory;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const options = useVariantOptions(category);
  const label = VARIANT_LABEL[category];
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newText, setNewText] = useState("");

  // Reset variant if not in current options list when category changes
  useEffect(() => {
    if (!label) {
      if (value) onChange("");
      return;
    }
    if (value && !options.includes(value)) onChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (!label) return null;

  const startEdit = (v: string) => { setEditing(v); setEditText(v); };
  const commitEdit = () => {
    if (!editing) return;
    const n = editText.trim();
    if (n && n !== editing) {
      renameVariantOption(category, editing, n);
      if (value === editing) onChange(n);
      toast.success(`เปลี่ยน "${editing}" → "${n}"`);
    }
    setEditing(null);
  };
  const addNew = () => {
    const n = newText.trim();
    if (!n) return;
    addVariantOption(category, n);
    onChange(n);
    setNewText("");
    toast.success(`เพิ่ม "${n}" แล้ว`);
  };

  return (
    <div className="rounded-xl bg-muted/40 ring-1 ring-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">เลือก{label} *</span>
        <span className="text-[10px] text-muted-foreground">แก้/ลบได้ตามต้องการ</span>
      </div>

      {options.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const isActive = value === opt;
            if (editing === opt) {
              return (
                <span key={opt} className="inline-flex items-center gap-1 rounded-full bg-card ring-1 ring-brand px-2 h-8">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
                    autoFocus
                    className="w-24 bg-transparent outline-none text-[11px] font-medium"
                  />
                  <button type="button" onClick={commitEdit} className="size-5 grid place-items-center text-brand">
                    <Check className="size-3" />
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="size-5 grid place-items-center text-muted-foreground">
                    <X className="size-3" />
                  </button>
                </span>
              );
            }
            return (
              <span
                key={opt}
                className={cn(
                  "inline-flex items-center rounded-full ring-1 transition-colors h-8 pl-2.5 pr-1",
                  isActive
                    ? "bg-brand text-brand-foreground ring-brand"
                    : "bg-card text-foreground ring-border",
                )}
              >
                <button
                  type="button"
                  onClick={() => onChange(opt)}
                  className="text-[11px] font-medium"
                >
                  {opt}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(opt)}
                  aria-label={`แก้ไข ${opt}`}
                  className="ml-1 size-5 grid place-items-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeVariantOption(category, opt);
                    if (value === opt) onChange("");
                    toast.success(`ลบ "${opt}" แล้ว`);
                  }}
                  aria-label={`ลบ ${opt}`}
                  className="size-5 grid place-items-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">ยังไม่มีตัวเลือก — เพิ่มได้ด้านล่าง</p>
      )}

      <div className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNew(); } }}
          placeholder={`เพิ่ม${label}ใหม่`}
          className="flex-1 min-w-0 rounded-lg bg-background ring-1 ring-border focus:ring-brand outline-none px-3 min-h-[36px] text-xs"
        />
        <button
          type="button"
          onClick={addNew}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-brand text-brand-foreground px-3 min-h-[36px] text-xs font-semibold"
        >
          <Plus className="size-3.5" /> เพิ่ม
        </button>
      </div>

      {error && <p className="text-[11px] font-medium text-critical">{error}</p>}
    </div>
  );
}

