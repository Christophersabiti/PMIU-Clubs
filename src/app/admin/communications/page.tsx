import { db } from "@/lib/db";
import { isChapterAdmin, manageableClubs, requireAdmin } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { sendAnnouncement } from "@/app/actions/admin";
import { AdminTitle, Table, td } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Checkbox, Input, Select, Textarea } from "@/components/ui";

export const metadata = { title: "Communications" };

export default async function Communications() {
  const user = await requireAdmin();
  const chapter = isChapterAdmin(user);
  const [clubs, outbox] = await Promise.all([
    manageableClubs(user, "communications.send"),
    chapter ? db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }) : [],
  ]);
  const emailLive = !!process.env.RESEND_API_KEY;
  return (
    <>
      <AdminTitle title="Communications" subtitle="Email + in-app notifications. WhatsApp stays the conversation channel — this platform remains the source of truth." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="font-display text-xl font-semibold">Send an announcement</h2>
          <ActionForm action={sendAnnouncement} className="mt-4 space-y-3" resetOnSuccess confirm="Send this announcement to all members in the selected audience?">
            <Select label="Audience" name="clubId" options={clubs.map((c) => ({ value: c.id, label: `${c.shortName} members` }))} placeholder={chapter ? "All platform users" : undefined} required={!chapter} />
            <Input label="Subject" name="title" required />
            <Textarea label="Message" name="body" rows={6} required />
            <Input label="Link (optional)" name="link" placeholder="/events/…" />
            <Checkbox name="alsoPost" label="Also publish as an announcement on the News page" defaultChecked />
            <SubmitButton pendingText="Sending…">Send</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="font-display text-xl font-semibold">Automatic emails</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {["Welcome (on sign-up)", "Club joined / request received / approved", "Registration confirmation + QR ticket", "Event reminder (24h before, via cron)", "Event cancellation", "New announcement"].map((t) => <li key={t}>✓ {t}</li>)}
          </ul>
          <p className="mt-4 text-sm">Delivery: {emailLive ? <Badge tone="green">Live via Resend</Badge> : <Badge tone="gold">Outbox mode — set RESEND_API_KEY to send</Badge>}</p>
          {chapter && <p className="mt-2 text-xs text-muted">Reminder job: <code>GET /api/cron/reminders</code> with <code>Authorization: Bearer $CRON_SECRET</code> (scheduled hourly in vercel.json).</p>}
        </Card>
      </div>
      {chapter && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-xl font-semibold">Email outbox (latest 50)</h2>
          <Table head={["To", "Subject", "Template", "Status", "When"]} empty={outbox.length === 0}>
            {outbox.map((e) => (
              <tr key={e.id}>
                <td className={td}>{e.to}</td>
                <td className={td}>{e.subject}</td>
                <td className={td}><code className="text-xs">{e.template}</code></td>
                <td className={td}><Badge tone={e.status === "SENT" ? "green" : e.status === "FAILED" ? "red" : "gray"}>{e.status.toLowerCase()}</Badge></td>
                <td className={td}>{formatDateTime(e.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </>
  );
}
