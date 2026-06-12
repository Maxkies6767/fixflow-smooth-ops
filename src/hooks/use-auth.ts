import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "owner" | "technician";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  displayName: string | null;
}

let cached: AuthState = {
  loading: true,
  session: null,
  user: null,
  role: null,
  displayName: null,
};
const listeners = new Set<() => void>();
const emit = (next: AuthState) => {
  cached = next;
  listeners.forEach((l) => l());
};

async function fetchProfile(userId: string): Promise<{ role: AppRole | null; displayName: string | null }> {
  const [rolesRes, profileRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
  ]);
  return {
    role: (rolesRes.data?.role as AppRole | undefined) ?? null,
    displayName: profileRes.data?.display_name ?? null,
  };
}

let initialized = false;
function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      emit({ loading: false, session: null, user: null, role: null, displayName: null });
      return;
    }
    emit({ loading: true, session, user: session.user, role: cached.role, displayName: cached.displayName });
    setTimeout(async () => {
      const profile = await fetchProfile(session.user.id);
      emit({ loading: false, session, user: session.user, ...profile });
    }, 0);
  });

  supabase.auth.getSession().then(async ({ data }) => {
    const session = data.session;
    if (!session?.user) {
      emit({ loading: false, session: null, user: null, role: null, displayName: null });
      return;
    }
    const profile = await fetchProfile(session.user.id);
    emit({ loading: false, session, user: session.user, ...profile });
  });
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(cached);
  useEffect(() => {
    init();
    const l = () => setState(cached);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}
