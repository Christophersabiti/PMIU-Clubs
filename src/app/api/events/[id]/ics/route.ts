import { db } from "@/lib/db";
import { appUrl } from "@/lib/utils";

const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export async function GET(_req: Request, ctx: RouteContext<"/api/events/[id]/ics">) {
  const { id } = await ctx.params;
  const e = await db.event.findUnique({ where: { id }, include: { club: true } });
  if (!e || e.status === "DRAFT") return new Response("Not found", { status: 404 });
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PMI Uganda Clubs//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@pmiuganda-clubs`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(e.startsAt)}`,
    `DTEND:${f(e.endsAt)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(`${e.summary ?? ""}\n${e.club.name}\n${appUrl(`/events/${e.id}`)}`)}`,
    `LOCATION:${esc(e.mode === "ONLINE" ? "Online" : e.locationName ?? "")}`,
    `URL:${appUrl(`/events/${e.id}`)}`,
    e.status === "CANCELLED" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="event-${e.id}.ics"` } });
}
