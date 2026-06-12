import { useMemo, useState } from "react";
import { Search, Smartphone, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDeviceCatalog, addBrand, addModel } from "@/mocks/device-catalog";

interface Props {
  brand: string;
  model: string;
  onBrandChange: (v: string) => void;
  onModelChange: (v: string) => void;
}

const POPULAR = ["Apple", "Samsung", "Xiaomi", "OPPO", "Vivo", "realme"];

export function DeviceAutocomplete({ brand, model, onBrandChange, onModelChange }: Props) {
  const catalog = useDeviceCatalog();
  const brands = useMemo(() => Object.keys(catalog), [catalog]);
  const [brandFocus, setBrandFocus] = useState(false);
  const [modelFocus, setModelFocus] = useState(false);

  const quickBrands = useMemo(
    () => POPULAR.filter((b) => brands.includes(b)).concat(
      brands.filter((b) => !POPULAR.includes(b)).slice(0, 2),
    ).slice(0, 6),
    [brands],
  );

  const brandQ = brand.trim().toLowerCase();
  const brandMatches = useMemo(() => {
    if (!brandQ) return brands.slice(0, 8);
    return brands.filter((b) => b.toLowerCase().includes(brandQ)).slice(0, 8);
  }, [brandQ, brands]);
  const brandExact = brands.some((b) => b.toLowerCase() === brandQ);

  const modelQ = model.trim().toLowerCase();
  const currentBrandKey = brands.find((b) => b.toLowerCase() === brandQ);
  const modelMatches = useMemo<{ b: string; m: string }[]>(() => {
    if (currentBrandKey) {
      const arr = catalog[currentBrandKey] ?? [];
      const filtered = modelQ ? arr.filter((m) => m.toLowerCase().includes(modelQ)) : arr;
      return filtered.slice(0, 8).map((m) => ({ b: currentBrandKey, m }));
    }
    if (modelQ.length >= 2) {
      const all = brands.flatMap((b) => (catalog[b] ?? []).map((m) => ({ b, m })));
      return all.filter((x) => x.m.toLowerCase().includes(modelQ)).slice(0, 8);
    }
    return [];
  }, [currentBrandKey, modelQ, brands, catalog]);
  const modelExact = currentBrandKey
    ? (catalog[currentBrandKey] ?? []).some((m) => m.toLowerCase() === modelQ)
    : false;

  const handleAddBrand = () => {
    const v = brand.trim();
    if (!v) return;
    const k = addBrand(v);
    if (k) {
      onBrandChange(k);
      toast.success(`เพิ่มยี่ห้อ "${k}" แล้ว`);
    }
    setBrandFocus(false);
  };

  const handleAddModel = () => {
    if (!currentBrandKey) return;
    const v = model.trim();
    if (!v) return;
    if (addModel(currentBrandKey, v)) {
      toast.success(`เพิ่มรุ่น "${v}" ให้ ${currentBrandKey} แล้ว`);
    }
    onModelChange(v);
    setModelFocus(false);
  };

  return (
    <div className="space-y-3">
      {/* Brand quick-pick chips */}
      {quickBrands.length > 0 && (
        <div className="-mx-1 px-1 flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible pb-1">
          {quickBrands.map((b) => {
            const active = currentBrandKey === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => onBrandChange(b)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 h-9 text-xs font-medium ring-1 transition-colors",
                  active
                    ? "bg-brand text-brand-foreground ring-brand"
                    : "bg-card text-muted-foreground ring-border hover:text-foreground",
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      )}

      {/* Brand input */}
      <div className="relative">
        <label className="block">
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">ยี่ห้อ *</span>
          <input
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            onFocus={() => setBrandFocus(true)}
            onBlur={() => setTimeout(() => setBrandFocus(false), 180)}
            placeholder="Apple / Samsung / Xiaomi / พิมพ์ยี่ห้อใหม่"
            className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px]"
          />
        </label>
        {brandFocus && (brandMatches.length > 0 || (brandQ && !brandExact)) && (
          <SuggestList hint={brandQ ? "ไม่เจอ? เพิ่มเข้าคลังได้เลย" : "ยี่ห้อที่ใช้บ่อย"}>
            {brandMatches.map((b) => (
              <SuggestItem
                key={b}
                onMouseDown={() => {
                  onBrandChange(b);
                  setBrandFocus(false);
                }}
                title={b}
                subtitle={`${(catalog[b] ?? []).length} รุ่นในระบบ`}
              />
            ))}
            {brandQ && !brandExact && (
              <AddRow
                label={`เพิ่มยี่ห้อ "${brand.trim()}"`}
                onMouseDown={handleAddBrand}
              />
            )}
          </SuggestList>
        )}
      </div>

      {/* Model input */}
      <div className="relative">
        <label className="block">
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">รุ่น *</span>
          <input
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            onFocus={() => setModelFocus(true)}
            onBlur={() => setTimeout(() => setModelFocus(false), 180)}
            placeholder={currentBrandKey ? `เช่น ${(catalog[currentBrandKey]?.[0]) ?? "รุ่น"}` : "เช่น iPhone 15 Pro Max"}
            className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px]"
          />
        </label>
        {modelFocus && (modelMatches.length > 0 || (modelQ && currentBrandKey && !modelExact)) && (
          <SuggestList
            hint={
              currentBrandKey
                ? `รุ่นของ ${currentBrandKey} · ไม่เจอ? เพิ่มได้เลย`
                : "เลือกยี่ห้อก่อน หรือพิมพ์ค้นข้ามยี่ห้อ"
            }
          >
            {modelMatches.map(({ b, m }) => (
              <SuggestItem
                key={`${b}-${m}`}
                onMouseDown={() => {
                  if (!currentBrandKey) onBrandChange(b);
                  onModelChange(m);
                  setModelFocus(false);
                }}
                title={m}
                subtitle={b}
              />
            ))}
            {modelQ && currentBrandKey && !modelExact && (
              <AddRow
                label={`เพิ่มรุ่น "${model.trim()}" ให้ ${currentBrandKey}`}
                onMouseDown={handleAddModel}
                icon={<Sparkles className="size-4" />}
              />
            )}
          </SuggestList>
        )}
      </div>
    </div>
  );
}

function SuggestList({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl bg-card ring-1 ring-border shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border text-[11px] text-muted-foreground">
        <Search className="size-3" /> {hint}
      </div>
      <ul className="max-h-64 overflow-y-auto py-1">{children}</ul>
    </div>
  );
}

function SuggestItem({
  title, subtitle, onMouseDown,
}: { title: string; subtitle: string; onMouseDown: () => void }) {
  return (
    <li>
      <button
        type="button"
        onMouseDown={onMouseDown}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors min-h-[48px]",
        )}
      >
        <span className="size-8 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">
          <Smartphone className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium truncate">{title}</span>
          <span className="block text-[11px] text-muted-foreground truncate">{subtitle}</span>
        </span>
      </button>
    </li>
  );
}

function AddRow({
  label, onMouseDown, icon,
}: { label: string; onMouseDown: () => void; icon?: React.ReactNode }) {
  return (
    <li className="border-t border-border mt-1 pt-1">
      <button
        type="button"
        onMouseDown={onMouseDown}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand/10 transition-colors min-h-[48px]"
      >
        <span className="size-8 rounded-lg bg-brand/10 grid place-items-center text-brand shrink-0">
          {icon ?? <Plus className="size-4" />}
        </span>
        <span className="text-sm font-medium text-brand truncate">{label}</span>
      </button>
    </li>
  );
}
