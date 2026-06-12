import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Camera, Zap, RotateCcw, CheckCircle2, XCircle, Search } from "lucide-react";
import type { Html5Qrcode as Html5QrcodeType, CameraDevice } from "html5-qrcode";
import { usePartsList, getPartBySku } from "@/mocks/parts-store";
import { fmtBaht } from "@/mocks";
import type { Part } from "@/mocks/types";

export const Route = createFileRoute("/inventory/scan")({
  head: () => ({ meta: [{ title: "สแกน QR / Barcode · FIXFLOW" }] }),
  component: ScanPage,
});

type ScanResult =
  | { kind: "match"; part: Part; raw: string }
  | { kind: "miss"; raw: string };

function ScanPage() {
  const containerId = "qr-scanner-region";
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const navigate = useNavigate();
  // Keep parts list reactive so we recognise newly-added SKUs
  const parts = usePartsList();
  const [query, setQuery] = useState("");
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [] as Part[];
    return parts
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.variant ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [parts, query]);

  const start = async (camId: string) => {
    if (!scannerRef.current) return;
    try {
      setError(null);
      await scannerRef.current.start(
        camId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded: string) => handleDecoded(decoded),
        () => {},
      );
      setRunning(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปิดกล้องไม่สำเร็จ");
      setRunning(false);
    }
  };

  const stop = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      if (s.isScanning) await s.stop();
    } catch {
      /* noop */
    }
    setRunning(false);
  };

  const handleDecoded = (raw: string) => {
    // Extract first line / first token as SKU candidate
    const firstLine = raw.split(/\r?\n/)[0]?.trim() ?? raw.trim();
    const part = getPartBySku(firstLine) ?? getPartBySku(raw.trim());
    if (part) {
      setResult({ kind: "match", part, raw });
      // Audible/haptic feedback
      if (navigator.vibrate) navigator.vibrate(80);
    } else {
      setResult({ kind: "miss", raw: firstLine });
      if (navigator.vibrate) navigator.vibrate([60, 60, 60]);
    }
    stop();
  };

  useEffect(() => {
    let cancelled = false;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      scannerRef.current = new Html5Qrcode(containerId, { verbose: false });
      Html5Qrcode.getCameras()
        .then((devs: CameraDevice[]) => {
          if (cancelled) return;
          setCameras(devs);
          if (devs.length > 0) {
            const backIdx = devs.findIndex((d) => /back|rear|environment/i.test(d.label));
            const idx = backIdx >= 0 ? backIdx : 0;
            setCameraIndex(idx);
            start(devs[idx].id);
          } else {
            setError("ไม่พบกล้องในอุปกรณ์นี้");
          }
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "ขอสิทธิ์กล้องไม่สำเร็จ");
        });
    });
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    await stop();
    const next = (cameraIndex + 1) % cameras.length;
    setCameraIndex(next);
    await start(cameras[next].id);
  };

  const rescan = async () => {
    setResult(null);
    if (cameras[cameraIndex]) await start(cameras[cameraIndex].id);
  };

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-10 py-3 flex items-center gap-2">
        <Link to="/inventory" className="size-9 grid place-items-center rounded-lg hover:bg-muted -ml-2">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Inventory</p>
          <h1 className="text-lg font-semibold">สแกน QR / Barcode</h1>
        </div>
        {cameras.length > 1 && (
          <button
            onClick={switchCamera}
            className="size-9 grid place-items-center rounded-lg hover:bg-muted"
            aria-label="สลับกล้อง"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      </div>

      <div className="px-4 lg:px-10 py-6 max-w-2xl mx-auto space-y-6">
        {/* Camera viewport */}
        <div className="aspect-[3/4] rounded-2xl bg-zinc-950 relative overflow-hidden ring-1 ring-border">
          <div id={containerId} className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
          {!running && !result && (
            <div className="absolute inset-0 grid place-items-center text-zinc-400 bg-zinc-950/80">
              <div className="text-center px-6">
                <Camera className="size-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{error ? error : "กำลังเปิดกล้อง..."}</p>
                {error && (
                  <p className="text-xs mt-2 opacity-70">อนุญาตสิทธิ์กล้องในเบราว์เซอร์ แล้วลองใหม่</p>
                )}
              </div>
            </div>
          )}
          {/* viewfinder */}
          {running && (
            <div className="pointer-events-none absolute inset-x-12 top-1/2 -translate-y-1/2 aspect-square rounded-2xl border-2 border-brand/80">
              <div className="absolute -top-1 -left-1 size-6 border-t-4 border-l-4 border-brand rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 size-6 border-t-4 border-r-4 border-brand rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 size-6 border-b-4 border-l-4 border-brand rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 size-6 border-b-4 border-r-4 border-brand rounded-br-xl" />
            </div>
          )}
        </div>

        {/* Manual search fallback */}
        <div className="bg-card ring-1 ring-border rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-widest">
              ค้นหาด้วย SKU / ชื่ออะไหล่
            </span>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="เช่น SCR-IP14, จอ iPhone 15..."
            className="w-full h-11 rounded-lg bg-background ring-1 ring-border outline-none focus:ring-brand px-3 text-sm"
          />
          {suggestions.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setResult({ kind: "match", part: p, raw: p.sku });
                    setQuery("");
                    stop();
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-muted ring-1 ring-border bg-background"
                >
                  <p className="font-mono text-[10px] text-muted-foreground">{p.sku}</p>
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    คงเหลือ {p.stock} · {fmtBaht(p.price)}
                  </p>
                </button>
              ))}
            </div>
          )}
          {query.length > 0 && suggestions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">ไม่พบรายการที่ตรงกัน</p>
          )}
        </div>

        {/* Result */}
        {result?.kind === "match" ? (
          <div className="bg-card ring-1 ring-success/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4" />
              <span className="text-[11px] font-semibold uppercase tracking-widest">พบในคลัง</span>
              <Zap className="size-4 ml-auto text-brand" />
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="font-mono text-[11px] text-muted-foreground">{result.part.sku}</p>
              <p className="font-medium">{result.part.name}</p>
              {result.part.variant && (
                <p className="text-xs text-brand">ตัวเลือก: {result.part.variant}</p>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground text-xs">คงเหลือ</span>
                <span className="font-semibold tabular-nums">{result.part.stock} ชิ้น</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">ราคา</span>
                <span className="font-semibold tabular-nums">{fmtBaht(result.part.price)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={rescan}
                className="rounded-lg bg-card ring-1 ring-border min-h-[44px] text-sm font-medium"
              >
                สแกนต่อ
              </button>
              <button
                onClick={() => navigate({ to: "/inventory" })}
                className="rounded-lg bg-brand text-brand-foreground min-h-[44px] text-sm font-semibold"
              >
                เปิดในคลัง
              </button>
            </div>
          </div>
        ) : result?.kind === "miss" ? (
          (() => {
            // Find similar parts using fuzzy substring of any token from the raw value
            const raw = result.raw.toLowerCase();
            const tokens = raw.split(/[^a-z0-9ก-๙]+/i).filter((t) => t.length >= 2);
            const similar = parts
              .map((p) => {
                const hay = `${p.sku} ${p.name} ${p.variant ?? ""}`.toLowerCase();
                const score = tokens.reduce((s, t) => (hay.includes(t) ? s + t.length : s), 0);
                return { p, score };
              })
              .filter((x) => x.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((x) => x.p);
            return (
              <div className="bg-card ring-1 ring-warning/30 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <XCircle className="size-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest">ไม่พบ SKU นี้</span>
                </div>
                <p className="text-sm">
                  อ่านได้: <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{result.raw}</span>
                </p>
                {similar.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">รายการใกล้เคียง — แตะเพื่อเลือก</p>
                    {similar.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setResult({ kind: "match", part: p, raw: p.sku })}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-muted ring-1 ring-border bg-background"
                      >
                        <p className="font-mono text-[10px] text-muted-foreground">{p.sku}</p>
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          คงเหลือ {p.stock} · {fmtBaht(p.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    ไม่พบรายการใกล้เคียง — ลองพิมพ์ค้นหาด้านบนแทน
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={rescan}
                    className="rounded-lg bg-brand text-brand-foreground min-h-[44px] text-sm font-semibold"
                  >
                    สแกนใหม่
                  </button>
                  <Link
                    to="/inventory"
                    className="rounded-lg bg-card ring-1 ring-border min-h-[44px] text-sm font-medium grid place-items-center"
                  >
                    เลือกจากคลัง
                  </Link>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 text-center">
            <p className="text-xs text-muted-foreground">วาง Barcode/QR ของอะไหล่ในกรอบเพื่อสแกนอัตโนมัติ</p>
          </div>
        )}
      </div>
    </div>
  );
}
