import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Wrench, Package, Users, Settings, Plus, Mic, ShieldCheck, Search, BarChart3, LogOut, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { openCommandPalette } from "./command-palette";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { logActivity, setActivityActor } from "@/mocks/activity-log-store";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { to: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard, ownerOnly: false },
  { to: "/repairs", label: "งานซ่อม", icon: Wrench, ownerOnly: false },
  { to: "/inventory", label: "สต็อก", icon: Package, ownerOnly: false },
  { to: "/warranty", label: "รับประกัน", icon: ShieldCheck, ownerOnly: false },
  { to: "/customers", label: "ลูกค้า", icon: Users, ownerOnly: false },
  { to: "/reports", label: "รายงาน", icon: BarChart3, ownerOnly: true },
  { to: "/logs", label: "Logs", icon: Terminal, ownerOnly: true },
  { to: "/settings", label: "ตั้งค่า", icon: Settings, ownerOnly: true },
] as const;



export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role, displayName } = useAuth();
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  const isOwner = role === "owner";
  const visibleNav = NAV.filter((n) => !n.ownerOnly || isOwner);
  const mobileTabs = [
    visibleNav.find((n) => n.to === "/dashboard"),
    visibleNav.find((n) => n.to === "/repairs"),
    visibleNav.find((n) => n.to === "/inventory"),
    visibleNav.find((n) => n.to === "/customers"),
  ].filter(Boolean) as typeof NAV[number][];

  const initials = (displayName ?? user?.email ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setActivityActor(displayName ?? user?.email ?? null, user?.id ?? null);
  }, [displayName, user?.email, user?.id]);

  async function handleLogout() {
    const name = displayName ?? user?.email ?? "ผู้ใช้";
    logActivity({ level: "auth", category: "auth", message: `ออกจากระบบ — ${name}`, actor: name });
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col glass-bar border-r px-4 py-6 z-30">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 mb-8">
          <div className="size-9 rounded-lg bg-brand grid place-items-center text-brand-foreground font-bold">F</div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Operations</span>
            <span className="text-base font-semibold tracking-tight">FIXFLOW</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={openCommandPalette}
          className="mb-3 flex items-center gap-2 rounded-lg bg-muted/60 hover:bg-muted px-3 py-2 text-xs text-muted-foreground ring-1 ring-border min-h-[40px]"
        >
          <Search className="size-3.5" />
          <span>ค้นหา</span>
          <span className="ml-auto font-mono text-[10px] bg-background px-1.5 py-0.5 rounded ring-1 ring-border">⌘K</span>
        </button>

        <nav className="flex flex-col gap-1">

          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          to="/repairs/new"
          className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
        >
          <Plus className="size-4" />
          รับเครื่องใหม่
        </Link>

        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{displayName ?? user?.email ?? "ผู้ใช้งาน"}</p>
              <p className="text-[11px] text-muted-foreground uppercase">{role ?? "—"}</p>
            </div>
            <ThemeToggle compact />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="ออกจากระบบ"
              className="size-8 rounded-md grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-60">
        <main className="pb-32 lg:pb-12 pt-[calc(env(safe-area-inset-top)+52px)] lg:pt-[env(safe-area-inset-top)]">{children}</main>
      </div>

      {/* Mobile top bar — user + settings + logout, persistent on every page */}
      <div
        className="lg:hidden fixed inset-x-0 top-0 z-40 glass-bar border-b"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center gap-2 px-3 h-11">
          <div className="size-7 rounded-full bg-brand/10 text-brand grid place-items-center text-[10px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[12px] font-semibold truncate">{displayName ?? user?.email ?? "ผู้ใช้"}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{role ?? "—"}</span>
          </div>
          <ThemeToggle compact />
          {isOwner && (
            <Link
              to="/settings"
              aria-label="ตั้งค่า"
              className={cn(
                "size-8 grid place-items-center rounded-full transition-colors",
                isActive("/settings")
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Settings className="size-[18px]" />
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="ออกจากระบบ"
            className="size-8 grid place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-rose-600"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>


      {/* Voice FAB */}
      <button
        aria-label="Voice Assistant"
        className="fixed right-4 bottom-28 lg:bottom-6 size-12 rounded-full bg-foreground text-background shadow-lg grid place-items-center z-40 hover:scale-105 transition-transform"
      >
        <Mic className="size-5" />
        <span className="absolute -top-1 -right-1 size-3 rounded-full bg-brand ring-2 ring-background" />
      </button>


      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 glass-bar border-t z-50 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {mobileTabs.slice(0, 2).map((item) => (
            <BottomTab key={item.to} {...item} active={isActive(item.to)} />
          ))}

          <Link
            to="/repairs/new"
            className="-mt-8 size-14 rounded-2xl bg-brand text-brand-foreground shadow-lg shadow-brand/30 flex flex-col items-center justify-center ring-4 ring-background"
            aria-label="รับเครื่องใหม่"
          >
            <Plus className="size-5" />
            <span className="text-[9px] font-semibold mt-0.5 leading-none">รับเครื่อง</span>
          </Link>

          {mobileTabs.slice(2, 4).map((item) => (
            <BottomTab key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </div>
      </nav>

    </div>
  );
}

function BottomTab({
  to, label, icon: Icon, active,
}: { to: string; label: string; icon: typeof LayoutDashboard; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 w-14 py-1",
        active ? "text-brand" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
