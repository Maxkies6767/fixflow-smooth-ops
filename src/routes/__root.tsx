import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppLayout } from "../components/fixflow/app-layout";
import { Toaster } from "../components/ui/sonner";
import { CommandPalette } from "../components/fixflow/command-palette";
import { AuthGate } from "../components/fixflow/auth-gate";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">ไม่พบหน้าที่ค้นหา</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ลิงก์อาจถูกย้ายหรือไม่มีอยู่ในระบบ FIXFLOW
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-brand text-brand-foreground px-4 py-2.5 text-sm font-semibold"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">เกิดข้อผิดพลาด</h1>
        <p className="mt-2 text-sm text-muted-foreground">ระบบโหลดหน้านี้ไม่สำเร็จ ลองอีกครั้งได้เลย</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex rounded-lg bg-brand text-brand-foreground px-4 py-2.5 text-sm font-semibold"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "FIXFLOW — ระบบบริหารร้านซ่อมมือถือ" },
      { name: "description", content: "ระบบจัดการร้านซ่อมมือถือแบบครบวงจร: รับเครื่อง สต็อกอะไหล่ ลูกค้า และรายงาน" },
      { name: "theme-color", content: "#0f766e" },
      { property: "og:title", content: "FIXFLOW — ระบบบริหารร้านซ่อมมือถือ" },
      { property: "og:description", content: "ระบบจัดการร้านซ่อมมือถือแบบครบวงจร: รับเครื่อง สต็อกอะไหล่ ลูกค้า และรายงาน" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "FIXFLOW — ระบบบริหารร้านซ่อมมือถือ" },
      { name: "twitter:description", content: "ระบบจัดการร้านซ่อมมือถือแบบครบวงจร: รับเครื่อง สต็อกอะไหล่ ลูกค้า และรายงาน" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/998c7493-d616-427b-adc3-992f67652a6a/id-preview-4c3e1722--3a72a033-f8b4-45bc-8d4d-a5a6daed9a25.lovable.app-1781196069694.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/998c7493-d616-427b-adc3-992f67652a6a/id-preview-4c3e1722--3a72a033-f8b4-45bc-8d4d-a5a6daed9a25.lovable.app-1781196069694.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Thai:wght@400;500;600;700&family=Noto+Serif+Thai:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const standalone =
    pathname.startsWith("/track/") ||
    pathname.endsWith("/receipt") ||
    pathname === "/auth";
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        {standalone ? <Outlet /> : <AppLayout><Outlet /></AppLayout>}
        {!standalone && <CommandPalette />}
      </AuthGate>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

