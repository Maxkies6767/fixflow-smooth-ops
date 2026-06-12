import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMAIL_SUFFIX = "@fixflow.local";

function usernameToEmail(username: string) {
  const u = username.trim().toLowerCase();
  if (!u) throw new Error("ต้องระบุชื่อผู้ใช้");
  if (!/^[a-z0-9_.-]{2,32}$/.test(u)) throw new Error("ใช้เฉพาะ a-z, 0-9, _ . - ความยาว 2-32 ตัว");
  return u + EMAIL_SUFFIX;
}

function validContactEmail(e?: string | null) {
  if (!e) return null;
  const s = e.trim();
  if (!s) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error("อีเมลติดต่อไม่ถูกต้อง");
  return s;
}

async function requireOwner(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "owner" });
  if (error) throw error;
  if (!data) throw new Error("เฉพาะเจ้าของร้านเท่านั้น");
}

export const checkIsOwner = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    return { isOwner: !!data };
  });

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, { data: users }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name, contact_email, created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers(),
    ]);
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    const userMap = new Map((users?.users ?? []).map((u) => [u.id, u]));
    return (profiles ?? []).map((p: any) => {
      const u: any = userMap.get(p.id);
      const email = u?.email ?? "";
      const username = email.endsWith(EMAIL_SUFFIX) ? email.slice(0, -EMAIL_SUFFIX.length) : email;
      const bannedUntil = u?.banned_until ?? null;
      const suspended = !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
      return {
        id: p.id,
        username,
        displayName: p.display_name,
        contactEmail: p.contact_email ?? null,
        role: roleMap.get(p.id) ?? null,
        suspended,
        createdAt: p.created_at,
      };
    });
  });

export const createTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    username: string;
    password: string;
    displayName: string;
    contactEmail?: string;
    role?: "technician" | "owner";
  }) => d)
  .handler(async ({ data, context }) => {
    await requireOwner(context.supabase, context.userId);
    if (!data.displayName?.trim()) throw new Error("ต้องระบุชื่อที่แสดง");
    if (!data.password || data.password.length < 6) throw new Error("รหัสผ่านอย่างน้อย 6 ตัว");
    const contactEmail = validContactEmail(data.contactEmail);
    const role = data.role === "owner" ? "owner" : "technician";
    const email = usernameToEmail(data.username);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName.trim() },
    });
    if (error) throw new Error(error.message);
    if (created.user) {
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: created.user.id, display_name: data.displayName.trim(), contact_email: contactEmail });
      // Override default role from trigger if requested
      await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: created.user.id, role });
    }
    return { ok: true };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; password: string }) => d)
  .handler(async ({ data, context }) => {
    await requireOwner(context.supabase, context.userId);
    if (!data.password || data.password.length < 6) throw new Error("รหัสผ่านอย่างน้อย 6 ตัว");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setStaffSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; suspended: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireOwner(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("ห้ามระงับบัญชีตัวเอง");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((targetRoles ?? []).some((r) => r.role === "owner")) {
      throw new Error("ห้ามระงับบัญชีเจ้าของ");
    }
    const { error } = await (supabaseAdmin.auth.admin as any).updateUserById(data.userId, {
      ban_duration: data.suspended ? "876000h" : "none",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    await requireOwner(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("ห้ามลบบัญชีตัวเอง");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((targetRoles ?? []).some((r) => r.role === "owner")) {
      throw new Error("ห้ามลบบัญชีเจ้าของ");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
