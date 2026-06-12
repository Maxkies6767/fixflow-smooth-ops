import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Wrench, User, Package, MapPin, Plus, LayoutGrid, ScanLine } from "lucide-react";
import { searchAll } from "@/mocks";

export const COMMAND_PALETTE_OPEN_EVENT = "fixflow:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.getAttribute("contenteditable") === "true";

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "/" && !inField && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen as EventListener);
    };
  }, []);

  const hits = searchAll(q);
  const repairs = hits.filter((h) => h.kind === "repair").slice(0, 6);
  const customers = hits.filter((h) => h.kind === "customer").slice(0, 6);
  const parts = hits.filter((h) => h.kind === "part").slice(0, 5);
  const track = hits.find((h) => h.kind === "track");

  const go = (fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 0);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder="ค้นหา งานซ่อม / ลูกค้า / เบอร์ / IMEI / TR-..."
      />
      <CommandList>
        <CommandEmpty>{q.trim() ? "ไม่พบผลลัพธ์" : "พิมพ์เพื่อค้นหา..."}</CommandEmpty>

        {track && track.kind === "track" && (
          <CommandGroup heading="ลิงก์ติดตาม">
            <CommandItem
              value={`track-${track.code}`}
              onSelect={() => go(() => navigate({ to: "/track/$code", params: { code: track.code } }))}
            >
              <MapPin className="text-brand" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.sub}</p>
              </div>
            </CommandItem>
          </CommandGroup>
        )}

        {repairs.length > 0 && (
          <CommandGroup heading="งานซ่อม">
            {repairs.map((h) => h.kind === "repair" && (
              <CommandItem
                key={h.id}
                value={`repair-${h.id}-${h.title}`}
                onSelect={() => go(() => navigate({ to: "/repairs/$id", params: { id: h.id } }))}
              >
                <Wrench />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{h.sub}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {customers.length > 0 && (
          <CommandGroup heading="ลูกค้า">
            {customers.map((h) => h.kind === "customer" && (
              <CommandItem
                key={h.id}
                value={`customer-${h.id}-${h.title}`}
                onSelect={() => go(() => navigate({ to: "/customers/$id", params: { id: h.id } }))}
              >
                <User />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{h.sub}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {parts.length > 0 && (
          <CommandGroup heading="อะไหล่">
            {parts.map((h) => h.kind === "part" && (
              <CommandItem
                key={h.id}
                value={`part-${h.id}-${h.title}`}
                onSelect={() => go(() => navigate({ to: "/inventory" }))}
              >
                <Package />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{h.sub}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="ลัด">
          <CommandItem value="new-repair" onSelect={() => go(() => navigate({ to: "/repairs/new" }))}>
            <Plus /> รับเครื่องใหม่
          </CommandItem>
          <CommandItem value="open-kanban" onSelect={() => go(() => navigate({ to: "/repairs/queue" }))}>
            <LayoutGrid /> เปิดบอร์ดคิวช่าง
          </CommandItem>
          <CommandItem value="scan-imei" onSelect={() => go(() => navigate({ to: "/inventory/scan" }))}>
            <ScanLine /> สแกน IMEI
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
