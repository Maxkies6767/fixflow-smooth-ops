import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal, Search, Trash2, Pause, Play, Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  useActivityLog,
  clearActivityLog,
  migrateLocalActivityLogs,
  purgeOldActivityLogs,
  type ActivityEvent,
  type ActivityLevel,
  type ActivityCategory,
} from "@/mocks/activity-log-store";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Activity Terminal · FIXFLOW" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LogsPage,
});

const LEVEL_FILTERS: { key: ActivityLevel | "all"; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "create", label: "สร้าง" },
  { key: "update", label: "แก้ไข" },
  { key: "delete", label: "ลบ" },
  { key: "issue", label: "เบิก" },
  { key: "return", label: "คืน" },
  { key: "auth", label: "auth" },
  { key: "warn", label: "warn" },
  { key: "info", label: "info" },
];

const CAT_FILTERS: { key: ActivityCategory | "all"; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "repair", label: "งานซ่อม" },
  { key: "stock", label: "สต็อก" },
  { key: "part", label: "อะไหล่" },
  { key: "customer", label: "ลูกค้า" },
  { key: "warranty", label: "ประกัน" },
  { key: "staff", label: "พนักงาน" },
  { key: "settings", label: "ตั้งค่า" },
  { key: "auth", label: "auth" },
];

const LEVEL_COLOR: Record<ActivityLevel, string> = {
  create: "text-emerald-400",
  update: "text-yellow-300",
  delete: "text-rose-400",
  issue: "text-orange-400",
  return: "text-sky-400",
  auth: "text-violet-300",
  warn: "text-amber-300",
  info: "text-zinc-400",
};

const LEVEL_TAG: Record<ActivityLevel, string> = {
  create: "CREATE",
  update: "UPDATE",
  delete: "DELETE",
  issue: "ISSUE ",
  return: "RETURN",
  auth: "AUTH  ",
  warn: "WARN  ",
  info: "INFO  ",
};

const HIGHLIGHT_RE =
  /(ลบ|ยกเลิก|เพิ่ม|สร้าง|แก้ไข|เบิก|คืน|ระงับ|รีเซ็ต|เข้าสู่ระบบ|ออกจากระบบ|เปลี่ยนสถานะ)/g;

function highlight(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  HIGHLIGHT_RE.lastIndex = 0;
  while ((m = HIGHLIGHT_RE.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const word = m[0];
    const cls =
      word === "ลบ" || word === "ยกเลิก"
        ? "text-rose-400 font-bold"
        : word === "เพิ่ม" || word === "สร้าง"
          ? "text-emerald-400 font-bold"
          : word === "เบิก"
            ? "text-orange-400 font-bold"
            : word === "คืน"
              ? "text-sky-400 font-bold"
              : word === "แก้ไข" || word === "เปลี่ยนสถานะ"
                ? "text-yellow-300 font-bold"
                : word === "ระงับ"
                  ? "text-amber-300 font-bold"
                  : word === "รีเซ็ต"
                    ? "text-violet-300 font-bold"
                    : "text-violet-300 font-bold";
    parts.push(
      <span key={`${m.index}-${word}`} className={cls}>
        {word}
      </span>,
    );
    last = m.index + word.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function LogsPage() {
  const { role, loading } = useAuth();
  const isOwner = role === "owner";
  const navigate = useNavigate();
  const events = useActivityLog();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<ActivityLevel | "all">("all");
  const [category, setCategory] = useState<ActivityCategory | "all">("all");
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    if (!loading && !isOwner) {
      toast.error("เฉพาะเจ้าของร้านเท่านั้นที่เข้าถึงหน้านี้ได้");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, isOwner, navigate]);

  // owner-only: upload legacy localStorage logs once, then purge logs older than 90 days
  useEffect(() => {
    if (loading || !isOwner) return;
    (async () => {
      const n = await migrateLocalActivityLogs();
      if (n > 0) toast.success(`อัปโหลดประวัติเก่า ${n} รายการขึ้น Cloud แล้ว`);
      await purgeOldActivityLogs();
    })();
  }, [loading, isOwner]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // events stored newest-first; show oldest at top so newest appears at bottom (terminal-style)
    const reversed = [...events].reverse();
    return reversed.filter((e) => {
      if (level !== "all" && e.level !== level) return false;
      if (category !== "all" && e.category !== category) return false;
      if (!q) return true;
      return (
        e.message.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (e.refId ?? "").toLowerCase().includes(q)
      );
    });
  }, [events, query, level, category]);

  // autoscroll
  useEffect(() => {
    if (paused) return;
    const el = scrollRef.current;
    if (!el) return;
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [filtered, paused]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  function handleExport() {
    const lines = filtered.map(
      (e) =>
        `[${new Date(e.at).toISOString()}] [${e.level.toUpperCase()}] [${e.category}] ${e.actor} › ${e.message}${e.refId ? ` (${e.refId})` : ""}`,
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${fmtDate(new Date().toISOString())}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleClear() {
    if (!confirm("ล้างประวัติกิจกรรมทั้งหมด?\nการกระทำนี้ย้อนกลับไม่ได้")) return;
    try {
      await clearActivityLog();
      toast.success("ล้างประวัติแล้ว");
    } catch {
      toast.error("ล้างประวัติไม่สำเร็จ");
    }
  }

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
    <div className="px-3 lg:px-8 py-4 lg:py-8 max-w-5xl mx-auto pt-16 lg:pt-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-9 rounded-lg bg-zinc-900 text-emerald-400 grid place-items-center">
            <Terminal className="size-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-semibold truncate">Activity Terminal</h1>
            <p className="text-[11px] text-muted-foreground">
              {events.length} เหตุการณ์ · แสดง {filtered.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={cn(
              "h-9 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 ring-1",
              paused
                ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300"
                : "bg-card text-muted-foreground ring-border",
            )}
            title={paused ? "เลื่อนอัตโนมัติถูกหยุด" : "หยุดเลื่อนอัตโนมัติ"}
          >
            {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            <span className="hidden sm:inline">{paused ? "เล่น" : "หยุด"}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="h-9 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 ring-1 bg-card text-muted-foreground ring-border"
            title="Export .txt"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="h-9 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 ring-1 bg-card text-rose-600 ring-border hover:bg-rose-50 dark:hover:bg-rose-950"
            title="ล้างประวัติ"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">ล้าง</span>
          </button>
        </div>
      </div>

      <div className="relative mb-2">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหา ข้อความ / ผู้ใช้ / id…"
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-card ring-1 ring-border outline-none focus:ring-brand text-sm"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 mb-1.5 pb-1">
        {LEVEL_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setLevel(f.key)}
            className={cn(
              "shrink-0 inline-flex items-center px-2.5 h-7 rounded-full text-[11px] font-semibold ring-1",
              level === f.key
                ? "bg-foreground text-background ring-foreground"
                : "bg-card text-muted-foreground ring-border hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 mb-2 pb-1">
        {CAT_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setCategory(f.key)}
            className={cn(
              "shrink-0 inline-flex items-center px-2.5 h-7 rounded-full text-[11px] font-medium ring-1",
              category === f.key
                ? "bg-brand/10 text-brand ring-brand"
                : "bg-card text-muted-foreground ring-border hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="rounded-xl bg-zinc-950 text-zinc-100 ring-1 ring-zinc-800 font-mono text-[11.5px] leading-relaxed p-3 overflow-y-auto h-[calc(100vh-300px)] min-h-[360px]"
      >
        {filtered.length === 0 ? (
          <div className="h-full grid place-items-center text-zinc-500">
            {events.length === 0 ? "ยังไม่มีกิจกรรม" : "ไม่พบรายการที่ตรงกัน"}
          </div>
        ) : (
          filtered.map((e) => <LogLine key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}

function LogLine({ event: e }: { event: ActivityEvent }) {
  return (
    <div className="flex gap-2 hover:bg-zinc-900/60 px-1 -mx-1 rounded">
      <span className="text-zinc-500 shrink-0">{fmtTime(e.at)}</span>
      <span className={cn("shrink-0 font-bold", LEVEL_COLOR[e.level])}>{LEVEL_TAG[e.level]}</span>
      <span className="text-zinc-400 shrink-0 truncate max-w-[120px]">{e.actor}</span>
      <span className="text-zinc-600 shrink-0">›</span>
      <span className="text-zinc-100 break-words flex-1 min-w-0">
        {highlight(e.message)}
        {e.refId ? <span className="text-zinc-500"> ({e.refId})</span> : null}
      </span>
    </div>
  );
}
