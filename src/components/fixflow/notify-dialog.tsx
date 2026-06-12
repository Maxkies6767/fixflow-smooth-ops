import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Smartphone, Send } from "lucide-react";
import { NOTIFICATION_TEMPLATES, fmtBaht } from "@/mocks";
import type { Repair } from "@/mocks/types";

export function NotifyDialog({ repair, children }: { repair: Repair; children: React.ReactNode }) {
  const [channel, setChannel] = useState<"line" | "sms">("line");
  const initialTpl = NOTIFICATION_TEMPLATES.find((t) => t.channel === channel) ?? NOTIFICATION_TEMPLATES[0];
  const [tplId, setTplId] = useState(initialTpl.id);
  const tpl = NOTIFICATION_TEMPLATES.find((t) => t.id === tplId) ?? initialTpl;

  const url = `https://fixflow.app/track/${repair.trackingCode ?? repair.id}`;
  const message = tpl.body
    .replace("{customer}", repair.customerName.replace("คุณ", ""))
    .replace("{device}", `${repair.brand} ${repair.model}`)
    .replace("{price}", fmtBaht(repair.estimatedPrice))
    .replace("{url}", url);
  const [text, setText] = useState(message);

  const tplsForChannel = NOTIFICATION_TEMPLATES.filter((t) => t.channel === channel);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>แจ้งลูกค้า</DialogTitle>
        </DialogHeader>

        <Tabs value={channel} onValueChange={(v) => {
          const c = v as "line" | "sms";
          setChannel(c);
          const first = NOTIFICATION_TEMPLATES.find((t) => t.channel === c);
          if (first) {
            setTplId(first.id);
            setText(first.body
              .replace("{customer}", repair.customerName.replace("คุณ", ""))
              .replace("{device}", `${repair.brand} ${repair.model}`)
              .replace("{price}", fmtBaht(repair.estimatedPrice))
              .replace("{url}", url));
          }
        }}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="line"><MessageCircle className="size-3.5 mr-1.5 text-success" /> LINE</TabsTrigger>
            <TabsTrigger value="sms"><Smartphone className="size-3.5 mr-1.5" /> SMS</TabsTrigger>
          </TabsList>
          <TabsContent value={channel} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">เทมเพลต</label>
              <div className="flex flex-wrap gap-1.5">
                {tplsForChannel.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTplId(t.id);
                      setText(t.body
                        .replace("{customer}", repair.customerName.replace("คุณ", ""))
                        .replace("{device}", `${repair.brand} ${repair.model}`)
                        .replace("{price}", fmtBaht(repair.estimatedPrice))
                        .replace("{url}", url));
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-full ring-1 ${tplId === t.id ? "bg-foreground text-background ring-foreground" : "ring-border text-muted-foreground"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                ส่งถึง: <span className="text-foreground font-medium">{repair.customerName} · {repair.phone}</span>
              </label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="text-sm" />
            </div>
            <button
              onClick={() => toast.success(`ส่ง${channel === "line" ? " LINE" : " SMS"}ถึง ${repair.customerName} แล้ว (mock)`)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground font-semibold min-h-[44px]"
            >
              <Send className="size-4" /> ส่งข้อความ
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
