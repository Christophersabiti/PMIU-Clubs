import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notify";
import { esc } from "@/lib/mail";
import { formatDateTime } from "@/lib/utils";

/** Sends a reminder to registered members for events starting within the next 24 hours (once per event). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 3600_000);
  const events = await db.event.findMany({
    where: { status: "PUBLISHED", reminderSentAt: null, startsAt: { gt: now, lte: soon } },
    include: { registrations: { where: { status: "REGISTERED" } } },
  });
  let sent = 0;
  for (const e of events) {
    for (const r of e.registrations) {
      await notifyUser(
        r.userId,
        { title: `Reminder: ${e.title}`, body: `${formatDateTime(e.startsAt)}${e.locationName ? ` · ${e.locationName}` : ""}`, link: `/tickets/${r.ticketCode}`, kind: "REMINDER" },
        { subject: `Tomorrow: ${e.title}`, html: `<p><strong>${esc(e.title)}</strong> starts ${esc(formatDateTime(e.startsAt))}.</p><p>Have your QR ticket ready for check-in.</p>`, cta: "Open my ticket", template: "event_reminder" },
      );
      sent++;
    }
    await db.event.update({ where: { id: e.id }, data: { reminderSentAt: now } });
  }
  return Response.json({ events: events.length, reminders: sent });
}
