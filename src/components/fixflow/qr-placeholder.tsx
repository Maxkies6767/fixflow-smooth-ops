import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  /** Text to encode into the QR (e.g. full tracking URL). Falls back to `code`. */
  value?: string;
  /** Short label shown under the QR (and used as encoded text when `value` is omitted). */
  code: string;
  size?: number;
}

export function QrPlaceholder({ value, code, size = 160 }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const payload = value ?? code;

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(payload, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then((str) => {
        if (!cancelled) setSvg(str);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div
        className="rounded-md ring-1 ring-border bg-white overflow-hidden grid place-items-center [&>svg]:block [&>svg]:w-full [&>svg]:h-full"
        style={{ width: size, height: size }}
        aria-label={`QR code for ${code}`}
      >
        {svg ? (
          <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: size, height: size }} />
        ) : (
          <div className="size-full animate-pulse bg-zinc-100" />
        )}
      </div>
      <span className="text-[10px] font-mono text-muted-foreground tracking-wider">{code}</span>
    </div>
  );
}
