import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

export function BarcodeSvg({ value, height = 60 }: { value: string; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue: true,
        fontSize: 12,
        height,
        margin: 4,
        background: "transparent",
        lineColor: "#000",
      });
    } catch {
      /* ignore */
    }
  }, [value, height]);
  return <svg ref={ref} className="max-w-full h-auto bg-white rounded-md p-1" />;
}

export function QrSvg({ value, size = 128 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    if (!value) {
      setSvg("");
      return;
    }
    QRCode.toString(value, {
      type: "svg",
      margin: 1,
      width: size,
      errorCorrectionLevel: "M",
    })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [value, size]);
  if (!svg) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-muted rounded-md animate-pulse"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="bg-white rounded-md p-1"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
