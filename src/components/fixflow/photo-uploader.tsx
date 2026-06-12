import { useRef } from "react";
import { Camera, X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

const MAX_SIDE = 1280;
const QUALITY = 0.82;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type || "image/jpeg" });
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", QUALITY);
}

export function PhotoUploader({ photos, onChange, max = 8 }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const next = [...photos];
    for (const f of Array.from(files)) {
      if (next.length >= max) break;
      if (!f.type.startsWith("image/")) continue;
      try {
        const url = await fileToCompressedDataUrl(f);
        next.push(url);
      } catch {
        /* ignore unreadable file */
      }
    }
    onChange(next);
  };

  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i));

  const canAdd = photos.length < max;

  return (
    <div className="space-y-2">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-3 gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-border bg-muted">
            <img src={src} alt={`สภาพเครื่อง ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 size-6 rounded-full bg-zinc-900/80 text-white grid place-items-center hover:bg-zinc-900"
              aria-label="ลบรูป"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {canAdd && (
          <>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className={cn(
                "aspect-[3/4] rounded-xl bg-muted ring-1 ring-dashed ring-border grid place-items-center text-center text-[11px] text-muted-foreground hover:bg-accent transition-colors",
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                <Camera className="size-5" />
                ถ่ายรูป
              </div>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="aspect-[3/4] rounded-xl bg-muted ring-1 ring-dashed ring-border grid place-items-center text-center text-[11px] text-muted-foreground hover:bg-accent transition-colors"
            >
              <div className="flex flex-col items-center gap-1.5">
                <ImagePlus className="size-5" />
                อัปโหลด
              </div>
            </button>
          </>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {photos.length}/{max} รูป · ระบบจะย่อภาพอัตโนมัติก่อนบันทึก
      </p>
    </div>
  );
}
