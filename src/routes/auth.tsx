import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { logActivity } from "@/mocks/activity-log-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ · FIXFLOW" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const EMAIL_SUFFIX = "@fixflow.local";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && pathname === "/auth") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, pathname, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = username.trim().toLowerCase();
      const email = u.includes("@") ? u : u + EMAIL_SUFFIX;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const meta: any = data.user?.user_metadata ?? {};
      const name = meta.display_name || meta.full_name || u;
      logActivity({ level: "auth", category: "auth", message: `เข้าสู่ระบบ — ${name}`, actor: name });
      toast.success(`ยินดีต้อนรับ ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.includes("Invalid login") ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" : msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="size-11 rounded-xl bg-brand grid place-items-center text-brand-foreground font-bold text-lg">F</div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Operations</span>
            <span className="text-lg font-semibold tracking-tight">FIXFLOW</span>
          </div>
        </div>

        <div className="bg-card ring-1 ring-border rounded-2xl p-6">
          <h1 className="text-lg font-semibold tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-xs text-muted-foreground mt-1">
            ใช้ชื่อผู้ใช้และรหัสผ่านที่เจ้าของร้านสร้างให้
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">ชื่อผู้ใช้</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full h-11 rounded-lg bg-muted/40 ring-1 ring-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="เช่น max"
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">รหัสผ่าน</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 rounded-lg bg-muted/40 ring-1 ring-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="รหัสผ่าน"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground h-11 text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              เข้าสู่ระบบ
            </button>
          </form>

          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            ยังไม่มีบัญชี? ติดต่อเจ้าของร้านให้สร้างบัญชีให้
          </p>
        </div>
      </div>
    </div>
  );
}
