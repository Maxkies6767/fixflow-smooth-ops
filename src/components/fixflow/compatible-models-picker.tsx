import { useMemo, useState } from "react";
import { X, Search, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDeviceCatalog, addModel } from "@/mocks/device-catalog";

interface Props {
  value: string; // comma-separated
  onChange: (v: string) => void;
}

const QUICK_BRANDS = ["Apple", "Samsung", "Xiaomi", "OPPO", "Vivo", "realme"];

export function CompatibleModelsPicker({ value, onChange }: Props) {
  const catalog = useDeviceCatalog();
  const brands = useMemo(() => Object.keys(catalog), [catalog]);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [addBrand, setAddBrand] = useState<string>("Apple");

  const selected = useMemo(
    () => value.split(",").map((s) => s.trim()).filter(Boolean),
    [value],
  );

  const setSelected = (next: string[]) => {
    const uniq = Array.from(new Set(next.map((s) => s.trim()).filter(Boolean)));
    onChange(uniq.join(", "));
  };

  const add = (m: string) => {
    setSelected([...selected, m]);
    setQ("");
  };
  const remove = (m: string) => setSelected(selected.filter((x) => x !== m));

  const query = q.trim().toLowerCase();
  const matches = useMemo<{ b: string; m: string }[]>(() => {
    const all = brands.flatMap((b) => (catalog[b] ?? []).map((m) => ({ b, m })));
    const filtered = query
      ? all.filter((x) => x.m.toLowerCase().includes(query) || x.b.toLowerCase().includes(query))
      : all;
    return filtered.filter((x) => !selected.includes(x.m)).slice(0, 8);
  }, [brands, catalog, query, selected]);

  const exact = query
    ? brands.some((b) => (catalog[b] ?? []).some((m) => m.toLowerCase() === query))
    : true;

  const handleAddNew = () => {
    const name = q.trim();
    if (!name) return;
    addModel(addBrand, name);
    add(name);
    toast.success(`เพิ่มรุ่น "${name}" ให้ ${addBrand} แล้ว`);
    setFocus(false);
  };

  return (
    <div className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">รุ่นที่ใช้ได้</span>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand ring-1 ring-brand/30 pl-2.5 pr-1 py-1 text-xs font-medium"
            >
              {m}
              <button
                type="button"
                onClick={() => remove(m)}
                aria-label={`ลบ ${m}`}
                className="size-5 grid place-items-center rounded-full hover:bg-brand/20"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 180)}
          placeholder="พิมพ์เพื่อค้นหารุ่น เช่น iPhone 13, Galaxy S23"
          className="w-full rounded-xl bg-background ring-1 ring-border focus:ring-brand outline-none px-4 min-h-[44px] text-[15px]"
        />

        {focus && (matches.length > 0 || (query && !exact)) && (
          <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl bg-card ring-1 ring-border shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border text-[11px] text-muted-foreground">
              <Search className="size-3" /> เลือกรุ่นจากคลัง · เลือกได้หลายรุ่น
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {matches.map(({ b, m }) => (
                <li key={`${b}-${m}`}>
                  <button
                    type="button"
                    onMouseDown={() => add(m)}
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
              {query && !exact && (
                <li className="border-t border-border mt-1 pt-2 px-3 pb-2 space-y-2">
                  <div className="text-[11px] text-muted-foreground">เพิ่ม "{q.trim()}" เป็นรุ่นใหม่ในคลัง</div>
                  <div className="flex gap-2">
                    <select
                      value={addBrand}
                      onChange={(e) => setAddBrand(e.target.value)}
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
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand text-brand-foreground min-h-[40px] text-xs font-semibold",
                      )}
                    >
                      <Plus className="size-3.5" /> เพิ่มและเลือก
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
