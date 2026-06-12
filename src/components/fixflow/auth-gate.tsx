import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const PUBLIC_PREFIXES = ["/auth", "/track/"];

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!session && !isPublic) {
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, isPublic, pathname, navigate]);

  if (isPublic) return <>{children}</>;
  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
