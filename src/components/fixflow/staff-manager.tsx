import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Users, Plus, Trash2, KeyRound, Loader2, X, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  listStaff,
  createTechnician,
  deleteStaff,
  resetStaffPassword,
  setStaffSuspended,
} from "@/lib/admin-users.functions";
import { logActivity } from "@/mocks/activity-log-store";

type Staff = {
  id: string;
  username: string;
  displayName: string | null;
  contactEmail: string | null;
  role: string | null;
  suspended: boolean;
  createdAt: string;
};

export function StaffManager() {
  const list = useServerFn(listStaff);
  const create = useServerFn(createTechnician);
  const remove = useServerFn(deleteStaff);
  const reset = useServerFn(resetStaffPassword);
  const suspend = useServerFn(setStaffSuspended);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [resetUser, setResetUser] = useState<Staff | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await list();
      setStaff(data as Staff[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "โหลดรายชื่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(s: Staff) {
    if (!confirm(`ลบบัญชี "${s.username}" ?\nการกระทำนี้ย้อนกลับไม่ได้`)) return;
    try {
      await remove({ data: { userId: s.id } });
      logActivity({ level: "delete", category: "staff", message: `ลบบัญชีพนักงาน "${s.username}"`, refId: s.id });
      toast.success("ลบบัญชีแล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  async function handleToggleSuspend(s: Staff) {
    const next = !s.suspended;
    if (!confirm(next ? `ระงับบัญชี "${s.username}" ?` : `ยกเลิกการระงับบัญชี "${s.username}" ?`)) return;
    try {
      await suspend({ data: { userId: s.id, suspended: next } });
      logActivity({
        level: "update",
        category: "staff",
        message: next ? `ระงับบัญชี "${s.username}"` : `ยกเลิกการระงับบัญชี "${s.username}"`,
        refId: s.id,
      });
      toast.success(next ? "ระงับบัญชีแล้ว" : "ยกเลิกการระงับแล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ");
    }
  }

  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-brand" />
          <h2 className="text-sm font-semibold">พนักงาน ({staff.length})</h2>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-brand text-brand-foreground px-3 h-9 text-xs font-semibold"
        >
          <Plus className="size-3.5" /> เพิ่ม
        </button>
      </div>

      {loading ? (
        <div className="py-8 grid place-items-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">ยังไม่มีพนักงาน</p>
      ) : (
        <div className="divide-y divide-border">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
              <div className={cn(
                "size-10 rounded-full grid place-items-center text-xs font-semibold uppercase shrink-0",
                s.suspended ? "bg-muted text-muted-foreground line-through" : "bg-muted",
              )}>
                {(s.displayName ?? s.username).slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={cn("text-sm font-medium truncate", s.suspended && "text-muted-foreground")}>
                    {s.displayName ?? s.username}
                  </p>
                  {s.suspended && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-300">
                      ระงับ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  @{s.username}{s.contactEmail ? ` · ${s.contactEmail}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 shrink-0",
                  s.role === "owner"
                    ? "bg-brand/10 text-brand ring-brand/20"
                    : "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300",
                )}
              >
                {s.role ?? "—"}
              </span>
              {s.role !== "owner" && (
                <div className="flex shrink-0">
                  <button
                    onClick={() => handleToggleSuspend(s)}
                    className={cn(
                      "size-9 grid place-items-center rounded-md hover:bg-muted",
                      s.suspended ? "text-emerald-600" : "text-muted-foreground hover:text-amber-600",
                    )}
                    aria-label={s.suspended ? "ยกเลิกระงับ" : "ระงับบัญชี"}
                    title={s.suspended ? "ยกเลิกการระงับ" : "ระงับบัญชี"}
                  >
                    {s.suspended ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                  </button>
                  <button
                    onClick={() => setResetUser(s)}
                    className="size-9 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="รีเซ็ตรหัสผ่าน"
                    title="รีเซ็ตรหัสผ่าน"
                  >
                    <KeyRound className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="size-9 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-rose-600"
                    aria-label="ลบ"
                    title="ลบบัญชี"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <AddDialog
          onClose={() => setAddOpen(false)}
          onCreate={async (payload) => {
            await create({ data: payload });
            logActivity({
              level: "create",
              category: "staff",
              message: `เพิ่มบัญชีพนักงาน "${payload.username}" (${payload.role})`,
            });
            toast.success("เพิ่มพนักงานแล้ว");
            setAddOpen(false);
            refresh();
          }}
        />
      )}

      {resetUser && (
        <ResetPwDialog
          staff={resetUser}
          onClose={() => setResetUser(null)}
          onSubmit={async (pw) => {
            await reset({ data: { userId: resetUser.id, password: pw } });
            logActivity({
              level: "update",
              category: "staff",
              message: `รีเซ็ตรหัสผ่านบัญชี "${resetUser.username}"`,
              refId: resetUser.id,
            });
            toast.success("รีเซ็ตรหัสผ่านแล้ว");
            setResetUser(null);
          }}
        />
      )}
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-card rounded-2xl ring-1 ring-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-md hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type CreatePayload = {
  username: string;
  password: string;
  displayName: string;
  contactEmail?: string;
  role: "technician" | "owner";
};

function AddDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (d: CreatePayload) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"technician" | "owner">("technician");
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (!displayName.trim()) return "กรุณากรอกชื่อที่แสดง";
    if (!/^[a-z0-9_.-]{2,32}$/.test(username.trim().toLowerCase()))
      return "ชื่อผู้ใช้ใช้เฉพาะ a-z, 0-9, _ . - ความยาว 2-32 ตัว";
    if (password.length < 6) return "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()))
      return "อีเมลติดต่อไม่ถูกต้อง";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    if (role === "owner" && !confirm("ยืนยันสร้างบัญชี 'เจ้าของร้าน' เพิ่ม?\nบัญชีนี้จะมีสิทธิ์เต็มในระบบ")) return;
    setBusy(true);
    try {
      await onCreate({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        password,
        role,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "เพิ่มไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="เพิ่มบัญชีพนักงาน" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input label="ชื่อที่แสดง *" value={displayName} onChange={setDisplayName} placeholder="เช่น ช่างเอก" />
        <Input label="ชื่อผู้ใช้ (a-z, 0-9) *" value={username} onChange={setUsername} placeholder="เช่น tech01" />
        <Input label="อีเมลติดต่อ (ไม่บังคับ)" value={contactEmail} onChange={setContactEmail} type="email" placeholder="contact@example.com" />
        <Input label="รหัสผ่าน *" value={password} onChange={setPassword} type="password" placeholder="อย่างน้อย 6 ตัว" />
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1">บทบาท</span>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setRole("technician")}
              className={cn("h-11 rounded-lg text-sm font-medium ring-1",
                role === "technician" ? "bg-brand/10 text-brand ring-brand" : "bg-card text-muted-foreground ring-border")}>
              ช่าง
            </button>
            <button type="button" onClick={() => setRole("owner")}
              className={cn("h-11 rounded-lg text-sm font-medium ring-1",
                role === "owner" ? "bg-brand/10 text-brand ring-brand" : "bg-card text-muted-foreground ring-border")}>
              เจ้าของร้าน
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-lg bg-brand text-brand-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />} สร้างบัญชี
        </button>
      </form>
    </Modal>
  );
}

function ResetPwDialog({
  staff,
  onClose,
  onSubmit,
}: {
  staff: Staff;
  onClose: () => void;
  onSubmit: (pw: string) => Promise<void>;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { toast.error("รหัสผ่านอย่างน้อย 6 ตัว"); return; }
    setBusy(true);
    try {
      await onSubmit(pw);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "รีเซ็ตไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`รีเซ็ตรหัสผ่าน @${staff.username}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input label="รหัสผ่านใหม่" value={pw} onChange={setPw} type="password" placeholder="อย่างน้อย 6 ตัว" />
        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-lg bg-brand text-brand-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />} บันทึก
        </button>
      </form>
    </Modal>
  );
}

function Input({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="none"
        className="w-full h-11 rounded-lg bg-background ring-1 ring-border focus:ring-brand focus:outline-none px-3 text-sm"
      />
    </label>
  );
}
