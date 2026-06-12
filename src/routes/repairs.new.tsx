import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Mic, Sparkles, Check, ArrowRight, ArrowLeft, UserCheck, Eye, EyeOff, Armchair } from "lucide-react";
import { CONDITION_LABEL, type ConditionFlag } from "@/mocks/types";
import { getCustomerById } from "@/mocks";
import type { Customer } from "@/mocks/types";
import { CustomerAutocomplete } from "@/components/fixflow/customer-autocomplete";
import { DeviceAutocomplete } from "@/components/fixflow/device-autocomplete";
import { IntakeSuccess } from "@/components/fixflow/intake-success";
import { PhotoUploader } from "@/components/fixflow/photo-uploader";
import { SignaturePad } from "@/components/fixflow/signature-pad";
import type { IntakeReceiptData } from "@/components/fixflow/intake-receipt-80mm";
import { useSymptomTemplates } from "@/mocks/symptom-templates-store";
import { createRepair } from "@/mocks/repairs-store";
import { cn } from "@/lib/utils";

interface NewSearch {
  customerId?: string;
}

export const Route = createFileRoute("/repairs/new")({
  head: () => ({
    meta: [
      { title: "รับเครื่องใหม่ · FIXFLOW" },
      { name: "description", content: "บันทึกงานซ่อมใหม่ภายใน 30 วินาที" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): NewSearch => ({
    customerId: typeof s.customerId === "string" ? s.customerId : undefined,
  }),
  component: NewRepairPage,
});

const CONDITIONS: ConditionFlag[] = ["screen_cracked", "bent_body", "scratches", "water_damage", "no_power", "no_case", "no_sim_tray", "missing_screws", "swollen_battery", "no_switch"];

const ACCESSORIES = ["เคส", "ฟิล์ม", "สายชาร์จ", "หัวชาร์จ", "หูฟัง", "ซิม", "MicroSD", "กล่อง"] as const;

type Step = 1 | 2 | 3;

interface IntakeForm {
  customer: Customer | null;
  name: string;
  phone: string;
  lineId: string;
  brand: string;
  model: string;
  imei: string;
  expectedDate: string;
  problem: string;
  flags: ConditionFlag[];
  accessories: string[];
  unlockInfo: string;
  photos: string[];
  signature?: string;
  acceptedTerms: boolean;
  price: string;
  deposit: string;
  walkIn: boolean;
}

const TECHNICIAN_NAME = "ช่างแม็ก";

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const blank: IntakeForm = {
  customer: null,
  name: "", phone: "", lineId: "",
  brand: "", model: "", imei: "",
  expectedDate: tomorrowISO(),
  problem: "",
  flags: [],
  accessories: [],
  unlockInfo: "",
  photos: [],
  signature: undefined,
  acceptedTerms: false,
  price: "", deposit: "",
  walkIn: false,
};

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `TR-${s}`;
}

function NewRepairPage() {
  const { customerId } = Route.useSearch();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<IntakeForm>(blank);
  const [showUnlock, setShowUnlock] = useState(false);
  const [done, setDone] = useState<null | { code: string; repairId: string; name: string; receipt: IntakeReceiptData }>(null);
  const symptomTemplates = useSymptomTemplates();

  useEffect(() => {
    if (customerId) {
      const c = getCustomerById(customerId);
      if (c) {
        setForm((f) => ({
          ...f,
          customer: c,
          name: c.name,
          phone: c.phone,
          lineId: c.lineId ?? "",
        }));
      }
    }
  }, [customerId]);

  const update = <K extends keyof IntakeForm>(k: K, v: IntakeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const selectCustomer = (c: Customer) =>
    setForm((f) => ({ ...f, customer: c, name: c.name, phone: c.phone, lineId: c.lineId ?? "" }));

  const clearCustomer = () =>
    setForm((f) => ({ ...f, customer: null, name: "", phone: "", lineId: "" }));

  const toggleFlag = (c: ConditionFlag) =>
    setForm((f) => ({ ...f, flags: f.flags.includes(c) ? f.flags.filter((x) => x !== c) : [...f.flags, c] }));

  const toggleAccessory = (a: string) =>
    setForm((f) => ({ ...f, accessories: f.accessories.includes(a) ? f.accessories.filter((x) => x !== a) : [...f.accessories, a] }));

  const canNext =
    step === 1 ? (form.walkIn || (!!form.name.trim() && !!form.phone.trim())) :
    step === 2 ? !!form.brand.trim() && !!form.model.trim() && !!form.problem.trim() :
    form.acceptedTerms;

  const signatureSectionRef = useRef<HTMLDivElement | null>(null);

  // เลื่อนขึ้นบนสุดทุกครั้งที่เปลี่ยน step
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.signature || !form.acceptedTerms) {
      toast.error(
        !form.signature ? "กรุณาให้ลูกค้าเซ็นลายเซ็นก่อน" : "กรุณาติ๊กยอมรับเงื่อนไขก่อน",
      );
      signatureSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const code = randomCode();
    const phoneClean = form.phone.trim();
    const effectiveName = form.walkIn
      ? (phoneClean ? `Walk-in (${phoneClean})` : "ลูกค้า Walk-in")
      : (form.name || "ลูกค้า");
    const effectivePhone = form.walkIn ? (phoneClean || "-") : form.phone;

    const created = createRepair({
      customerId: form.customer?.id ?? `walkin-${Date.now()}`,
      customerName: effectiveName,
      phone: effectivePhone,
      brand: form.brand,
      model: form.model,
      imei: form.imei,
      problem: form.problem,
      status: "received",
      technician: TECHNICIAN_NAME,
      estimatedPrice: Number(form.price) || 0,
      deposit: Number(form.deposit) || 0,
      conditions: form.flags,
      trackingCode: code,
      warrantyDays: 7,
      photos: form.photos,
      accessories: form.accessories,
      unlockInfo: form.unlockInfo || undefined,
      signature: form.signature,
      isWalkIn: form.walkIn,
    });

    const receipt: IntakeReceiptData = {
      repairId: created.id,
      trackingCode: code,
      customerName: effectiveName,
      phone: effectivePhone,
      lineId: form.walkIn ? undefined : (form.lineId || undefined),
      brand: form.brand,
      model: form.model,
      imei: form.imei,
      problem: form.problem,
      flags: form.flags,
      accessories: form.accessories,
      estimatedPrice: Number(form.price) || 0,
      deposit: Number(form.deposit) || 0,
      expectedDate: form.expectedDate || undefined,
      technician: TECHNICIAN_NAME,
      warrantyDays: 7,
      signature: form.signature,
      photosCount: form.photos.length,
    };
    setDone({ code, repairId: created.id, name: effectiveName, receipt });
  };

  if (done) {
    return (
      <div className="pb-32 lg:pb-16">
        <SubHeader title="รับเครื่องเรียบร้อย" />
        <IntakeSuccess
          repairId={done.repairId}
          trackingCode={done.code}
          customerName={done.name}
          receipt={done.receipt}
          onNewIntake={() => {
            setDone(null);
            setStep(1);
            setShowUnlock(false);
            // keep same customer prefilled for next device
            setForm((f) => ({
              ...blank,
              customer: f.customer,
              name: f.customer ? f.name : "",
              phone: f.customer ? f.phone : "",
              lineId: f.customer ? f.lineId : "",
            }));
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="pb-40 lg:pb-16">
      <SubHeader title="รับเครื่องซ่อมใหม่" />

      {/* Stepper */}
      <div className="px-4 lg:px-10 pt-5 max-w-3xl mx-auto">
        <ol className="flex items-center gap-2">
          {([1, 2, 3] as Step[]).map((n, i) => {
            const active = step === n;
            const passed = step > n;
            const labels = ["ลูกค้า", "เครื่อง + อาการ", "ราคา / ยืนยัน"];
            return (
              <li key={n} className="flex-1 flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => (passed ? setStep(n) : null)}
                  disabled={!passed && !active}
                  className={cn(
                    "flex items-center gap-2 min-w-0",
                    passed && "cursor-pointer",
                  )}
                >
                  <span
                    className={cn(
                      "size-7 rounded-full grid place-items-center text-[11px] font-bold shrink-0",
                      active && "bg-brand text-brand-foreground",
                      passed && "bg-brand/15 text-brand",
                      !active && !passed && "bg-muted text-muted-foreground",
                    )}
                  >
                    {passed ? <Check className="size-3.5" /> : n}
                  </span>
                  <span className={cn("text-xs font-medium truncate", active ? "text-foreground" : "text-muted-foreground")}>
                    {labels[i]}
                  </span>
                </button>
                {i < 2 && <span className={cn("h-px flex-1", passed ? "bg-brand/40" : "bg-border")} />}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="px-4 lg:px-10 pt-6 max-w-3xl mx-auto space-y-6">
        {customerId && form.customer && (
          <div className="flex items-center gap-2 rounded-xl bg-brand/10 ring-1 ring-brand/30 px-3 py-2.5 text-sm text-brand">
            <UserCheck className="size-4 shrink-0" />
            <span className="truncate">
              กำลังรับเครื่องใหม่ให้ลูกค้า: <span className="font-semibold">{form.customer.name}</span>
            </span>
          </div>
        )}
        {step === 1 && (
          <>
            <button
              type="button"
              onClick={() => {
                const next = !form.walkIn;
                setForm((f) => ({
                  ...f,
                  walkIn: next,
                  // เคลียร์ข้อมูลลูกค้าเก่าเมื่อเปลี่ยนโหมด
                  customer: next ? null : f.customer,
                  name: next ? "" : f.name,
                  lineId: next ? "" : f.lineId,
                }));
              }}
              className={cn(
                "w-full rounded-2xl ring-1 px-4 py-3 flex items-center gap-3 text-left transition-colors",
                form.walkIn
                  ? "bg-amber-50 dark:bg-amber-950/30 ring-amber-300 dark:ring-amber-700"
                  : "bg-card ring-border hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "size-10 rounded-xl grid place-items-center shrink-0",
                  form.walkIn ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground",
                )}
              >
                <Armchair className="size-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">
                  ลูกค้านั่งรอที่ร้าน (Walk-in)
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  ข้ามขั้นกรอกชื่อ/LINE — กรอกเบอร์ก็ได้ ไม่กรอกก็ได้
                </span>
              </span>
              <span
                className={cn(
                  "size-5 rounded-md ring-1 grid place-items-center shrink-0",
                  form.walkIn ? "bg-amber-500 ring-amber-500 text-white" : "ring-border",
                )}
              >
                {form.walkIn && <Check className="size-3.5" />}
              </span>
            </button>

            {form.walkIn ? (
              <Section title="เบอร์โทร (ไม่บังคับ)" hint="ใส่ไว้เผื่อโทรตามตอนซ่อมเสร็จ">
                <Field
                  label="เบอร์โทรศัพท์"
                  placeholder="08X-XXX-XXXX"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                />
              </Section>
            ) : (
              <Section title="ข้อมูลลูกค้า" hint="พิมพ์ชื่อหรือเบอร์เพื่อค้นจากลูกค้าเก่า">
                <CustomerAutocomplete
                  selected={form.customer}
                  name={form.name}
                  phone={form.phone}
                  lineId={form.lineId}
                  onNameChange={(v) => update("name", v)}
                  onPhoneChange={(v) => update("phone", v)}
                  onLineIdChange={(v) => update("lineId", v)}
                  onSelect={selectCustomer}
                  onClear={clearCustomer}
                />
              </Section>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Section title="ข้อมูลเครื่อง" hint="พิมพ์ยี่ห้อหรือรุ่นเพื่อค้นจากแคตตาล็อก">
              <DeviceAutocomplete
                brand={form.brand}
                model={form.model}
                onBrandChange={(v) => update("brand", v)}
                onModelChange={(v) => update("model", v)}
              />
              <Field label="IMEI / Serial Number" placeholder="15 หลัก"
                value={form.imei} onChange={(v) => update("imei", v)} />
            </Section>

            <Section title="อาการเสีย">
              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">อาการเสีย *</span>
                <textarea
                  rows={3}
                  value={form.problem}
                  onChange={(e) => update("problem", e.target.value)}
                  placeholder="ระบุอาการที่ลูกค้าแจ้ง..."
                  className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none px-4 py-3 text-[15px] resize-none"
                />
              </label>
              {symptomTemplates.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">เทมเพลตที่ใช้บ่อย — กดเพื่อใส่ในช่อง</p>
                  <div className="flex flex-wrap gap-1.5">
                    {symptomTemplates.slice(0, 12).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          update(
                            "problem",
                            form.problem ? `${form.problem}\n${t.text}` : t.text,
                          )
                        }
                        className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-accent ring-1 ring-border text-foreground"
                        title={t.category ? `หมวด: ${t.category}` : undefined}
                      >
                        + {t.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="เช็คลิสต์สภาพเครื่อง">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONDITIONS.map((c) => {
                  const on = form.flags.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleFlag(c)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 min-h-[44px] text-sm font-medium ring-1 transition-colors",
                        on ? "bg-brand/10 text-brand ring-brand"
                           : "bg-card text-muted-foreground ring-border hover:text-foreground",
                      )}
                    >
                      <span className={cn("size-4 rounded grid place-items-center ring-1", on ? "bg-brand ring-brand text-brand-foreground" : "ring-border")}>
                        {on && <Check className="size-3" />}
                      </span>
                      {CONDITION_LABEL[c]}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="ภาพถ่ายสภาพเครื่อง" hint="แนะนำถ่ายด้านหน้า/หลัง/ขอบ ก่อนรับเครื่อง">
              <PhotoUploader photos={form.photos} onChange={(p) => update("photos", p)} max={8} />
            </Section>

            <Section title="อุปกรณ์ที่มากับเครื่อง" hint="ติ๊กเฉพาะที่ลูกค้านำมา">
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES.map((a) => {
                  const on = form.accessories.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAccessory(a)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-xs font-medium ring-1 transition-colors",
                        on ? "bg-brand/10 text-brand ring-brand"
                           : "bg-card text-muted-foreground ring-border hover:text-foreground",
                      )}
                    >
                      <span className={cn("size-3.5 rounded grid place-items-center ring-1", on ? "bg-brand ring-brand text-brand-foreground" : "ring-border")}>
                        {on && <Check className="size-2.5" />}
                      </span>
                      {a}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="รหัสปลดล็อก / Apple ID" hint="เก็บไว้เฉพาะช่างใช้ปลดล็อกเครื่อง ลูกค้าตรวจสอบได้">
              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">PIN / Pattern / Apple ID</span>
                <div className="relative">
                  <input
                    type={showUnlock ? "text" : "password"}
                    value={form.unlockInfo}
                    onChange={(e) => update("unlockInfo", e.target.value)}
                    placeholder="เช่น 1234 หรือ apple.id@email.com / pwd"
                    autoComplete="off"
                    className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none px-4 h-11 pr-12 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlock((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label={showUnlock ? "ซ่อนรหัส" : "แสดงรหัส"}
                  >
                    {showUnlock ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>
            </Section>

            <div className="rounded-xl bg-zinc-900 text-zinc-100 p-5 ring-1 ring-zinc-900">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-3.5 text-emerald-300" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">AI Diagnostics</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                จากอาการที่ระบุ ระบบประเมินว่าน่าจะเป็นปัญหา <span className="text-zinc-100 font-medium">หน้าจอเสีย (LCD)</span> · ค่าอะไหล่โดยประมาณ ฿3,800 + ค่าแรง ฿500
              </p>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Section title="ราคา / เงินมัดจำ">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="ราคาประเมิน (บาท)" placeholder="0" type="number"
                  value={form.price} onChange={(v) => update("price", v)} />
                <Field label="เงินมัดจำ (บาท)" placeholder="0" type="number"
                  value={form.deposit} onChange={(v) => update("deposit", v)} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 ring-1 ring-border">
                <span className="text-xs text-muted-foreground">ยอดคงเหลือ</span>
                <span className="text-base font-semibold text-brand">
                  ฿{Math.max(0, (Number(form.price) || 0) - (Number(form.deposit) || 0)).toLocaleString()}
                </span>
              </div>
            </Section>

            <Section title="กำหนดงาน" hint={`ซ่อมโดย ${TECHNICIAN_NAME}`}>
              <Field label="วันที่นัดรับ" type="date"
                value={form.expectedDate} onChange={(v) => update("expectedDate", v)} />
            </Section>

            <Section title="สรุปก่อนเปิดใบรับซ่อม">
              <div className="space-y-2 text-sm">
                <KV k="ลูกค้า" v={`${form.name} · ${form.phone}`} />
                {form.lineId && <KV k="LINE" v={form.lineId} />}
                <KV k="เครื่อง" v={`${form.brand} ${form.model}`} />
                {form.imei && <KV k="IMEI" v={form.imei} />}
                <KV k="อาการ" v={form.problem || "—"} />
                {form.flags.length > 0 && (
                  <KV k="สภาพ" v={form.flags.map((f) => CONDITION_LABEL[f]).join(", ")} />
                )}
                {form.accessories.length > 0 && (
                  <KV k="อุปกรณ์" v={form.accessories.join(", ")} />
                )}
                {form.photos.length > 0 && <KV k="ภาพถ่าย" v={`${form.photos.length} รูป`} />}
                {form.unlockInfo && <KV k="รหัสปลดล็อก" v="•••••• (บันทึกแล้ว)" />}
                <KV k="ราคาประเมิน" v={form.price ? `฿${Number(form.price).toLocaleString()}` : "—"} />
                <KV k="เงินมัดจำ" v={form.deposit ? `฿${Number(form.deposit).toLocaleString()}` : "—"} />
                <KV k="ยอดคงเหลือ" v={`฿${Math.max(0, (Number(form.price) || 0) - (Number(form.deposit) || 0)).toLocaleString()}`} />
                {form.expectedDate && <KV k="วันนัดรับ" v={form.expectedDate} />}
                <KV k="ช่าง" v={TECHNICIAN_NAME} />
              </div>
            </Section>

            <div ref={signatureSectionRef} className="scroll-mt-24">
              <Section title="ลายเซ็นลูกค้า + ยอมรับเงื่อนไข" hint="ให้ลูกค้าเซ็นในกรอบและติ๊กยืนยันก่อนบันทึก">
                <SignaturePad value={form.signature} onChange={(v) => update("signature", v)} />
                <div className="rounded-xl bg-muted/60 px-4 py-3 ring-1 ring-border text-[11px] leading-relaxed text-muted-foreground">
                  1. ข้อมูล/ของในเครื่องเป็นความรับผิดชอบของลูกค้า<br />
                  2. กรณีตรวจแล้วไม่ซ่อม คิดค่าตรวจ 100 บาท<br />
                  3. หากไม่มารับเครื่องภายใน 90 วัน ทางร้านขอสงวนสิทธิ์จำหน่ายเพื่อชดเชยค่าซ่อม<br />
                  4. รับประกันงานซ่อม 7 วัน เฉพาะอาการเดิมที่แจ้งซ่อม
                </div>
                <label className={cn(
                  "flex items-start gap-2.5 rounded-xl px-4 py-3 ring-1 cursor-pointer transition-colors",
                  form.acceptedTerms ? "bg-brand/10 ring-brand" : "bg-card ring-border hover:bg-accent",
                )}>
                  <input
                    type="checkbox"
                    checked={form.acceptedTerms}
                    onChange={(e) => update("acceptedTerms", e.target.checked)}
                    className="mt-0.5 size-4 accent-current"
                  />
                  <span className={cn("text-sm font-medium", form.acceptedTerms ? "text-brand" : "text-foreground")}>
                    ลูกค้ายอมรับเงื่อนไขการรับซ่อมข้างต้น
                  </span>
                </label>
              </Section>
            </div>
          </>
        )}
      </div>

      {/* Sticky footer nav */}
      <div className="fixed inset-x-0 bottom-24 lg:bottom-6 z-30 px-4 lg:px-10">
        <div className="max-w-3xl mx-auto flex gap-2 bg-card/95 backdrop-blur rounded-xl p-2 ring-1 ring-border shadow-lg">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1 rounded-lg bg-muted text-foreground font-medium text-sm min-h-[48px] inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="size-4" /> ย้อนกลับ
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => (s + 1) as Step)}
              className={cn(
                "flex-1 rounded-lg font-semibold text-sm min-h-[48px] inline-flex items-center justify-center gap-2 transition-opacity",
                canNext ? "bg-brand text-brand-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              ถัดไป <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!form.acceptedTerms}
              className={cn(
                "flex-1 rounded-lg font-semibold text-sm min-h-[48px] inline-flex items-center justify-center gap-2 transition-opacity",
                form.acceptedTerms ? "bg-brand text-brand-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              <Check className="size-4" /> บันทึกและสร้างใบรับซ่อม
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function SubHeader({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-10 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Link to="/repairs" className="size-9 grid place-items-center rounded-lg hover:bg-muted -ml-2">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Quick Intake · 30 วินาที</p>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
      </div>
      <button type="button" className="size-9 grid place-items-center rounded-lg bg-foreground text-background" aria-label="Voice">
        <Mic className="size-4" />
      </button>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label, value, onChange, ...rest
}: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-card ring-1 ring-border focus:ring-brand outline-none px-4 h-11 text-[15px] text-foreground"
      />
    </label>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{k}</span>
      <span className="text-sm font-medium text-right">{v}</span>
    </div>
  );
}
