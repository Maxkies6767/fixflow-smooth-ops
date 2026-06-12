import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-brand grid place-items-center text-brand-foreground font-bold text-sm">F</div>
            <div className="flex flex-col leading-none">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">ติดตามสถานะ</span>
              <span className="text-sm font-semibold">FIXFLOW</span>
            </div>
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        © FIXFLOW · ระบบจัดการร้านซ่อมมือถือ
      </footer>
    </div>
  );
}
