import { db } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/permissions";
import { saveSettings } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Input, Textarea } from "@/components/ui";

export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireChapterAdmin();
  const s = Object.fromEntries((await db.setting.findMany()).map((r) => [r.key, r.value]));
  const integrations = [
    { name: "Email (Resend)", on: !!process.env.RESEND_API_KEY },
    { name: "Google sign-in", on: !!process.env.GOOGLE_CLIENT_ID },
    { name: "Reminder cron secret", on: !!process.env.CRON_SECRET },
  ];
  return (
    <>
      <AdminTitle title="Settings" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <ActionForm action={saveSettings} className="space-y-4">
            <Input label="Platform name" name="siteName" defaultValue={s.siteName ?? "PMI Uganda Clubs"} />
            <Input label="Tagline" name="tagline" defaultValue={s.tagline ?? ""} />
            <Input label="Contact email" name="contactEmail" type="email" defaultValue={s.contactEmail ?? ""} />
            <Textarea label="WhatsApp community guidelines" name="whatsappPolicy" defaultValue={s.whatsappPolicy ?? ""} rows={4} hint="Shown to Club Captains. The platform remains the system of record." />
            <SubmitButton>Save settings</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="font-display text-xl font-semibold">Integrations</h2>
          <ul className="mt-3 space-y-2 text-sm">{integrations.map((i) => <li key={i.name} className="flex justify-between">{i.name}<Badge tone={i.on ? "green" : "gray"}>{i.on ? "configured" : "not set"}</Badge></li>)}</ul>
          <p className="mt-3 text-xs text-muted">Configured via environment variables — see README.</p>
        </Card>
      </div>
    </>
  );
}
