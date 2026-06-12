import { useMemo, useState, useRef, useEffect } from "react";
import { Search, X, UserCheck } from "lucide-react";
import { allCustomers } from "@/mocks";
import type { Customer } from "@/mocks/types";
import { cn } from "@/lib/utils";

interface Props {
  selected: Customer | null;
  name: string;
  phone: string;
  lineId: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onLineIdChange: (v: string) => void;
  onSelect: (c: Customer) => void;
  onClear: () => void;
}

export function CustomerAutocomplete({
  selected, name, phone, lineId,
  onNameChange, onPhoneChange, onLineIdChange, onSelect, onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focusField, setFocusField] = useState<"name" | "phone" | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const query = (focusField === "phone" ? phone : name).trim().toLowerCase();
  const matches = useMemo(() => {
    if (selected || query.length < 2) return [];
    const all = allCustomers();
    return all
      .filter((c) => c.name.toLowerCase().includes(query) || c.phone.toLowerCase().includes(query))
      .slice(0, 5);
  }, [query, selected]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="space-y-3">
      {selected && (
        <div className="flex items-center gap-2 rounded-xl bg-brand/5 ring-1 ring-brand/20 px-3 py-2.5">
          <span className="size-8 rounded-full bg-brand/10 grid place-items-center text-brand">
            <UserCheck className="size-4" />
          </span>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-brand">ลูกค้าเก่า · มาแล้ว {selected.visits} ครั้ง</p>
            <p className="text-muted-foreground truncate">{selected.name} · {selected.phone}</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 min-h-[36px]"
          >
            <X className="size-3" /> พิมพ์ใหม่
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 relative">
        <Field
          label="ชื่อลูกค้า *"
          placeholder="เช่น คุณสมชาย"
          value={name}
          onChange={(v) => { onNameChange(v); setOpen(true); }}
          onFocus={() => { setFocusField("name"); setOpen(true); }}
          disabled={!!selected}
        />
        <Field
          label="เบอร์โทรศัพท์ *"
          placeholder="08X-XXX-XXXX"
          type="tel"
          value={phone}
          onChange={(v) => { onPhoneChange(v); setOpen(true); }}
          onFocus={() => { setFocusField("phone"); setOpen(true); }}
          disabled={!!selected}
        />

        {open && matches.length > 0 && (
          <div className="absolute z-30 left-0 right-0 top-full mt-1.5 rounded-xl bg-popover ring-1 ring-border shadow-lg overflow-hidden">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/40 flex items-center gap-2">
              <Search className="size-3" /> พบลูกค้าเก่า {matches.length} ราย
            </div>
            <ul>
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { onSelect(c); setOpen(false); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-3 min-h-[52px]"
                  >
                    <span className="size-9 rounded-full bg-muted grid place-items-center text-[11px] font-semibold text-muted-foreground shrink-0">
                      {c.name.slice(3, 5)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{c.name}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {c.phone}{c.lineId ? ` · ${c.lineId}` : ""} · {c.visits} ครั้ง
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Field
        label="LINE ID (ไม่บังคับ)"
        placeholder="@lineid"
        value={lineId}
        onChange={onLineIdChange}
        disabled={!!selected && !!selected.lineId}
      />
    </div>
  );
}

function Field({
  label, value, onChange, disabled, onFocus, ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onFocus?: () => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        {...rest}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className={cn(
          "w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px]",
          disabled && "opacity-70 cursor-not-allowed",
        )}
      />
    </label>
  );
}
