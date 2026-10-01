import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { Badge, Card, Container, EmptyState, PageHeader, SectionHeading } from "@/components/ui";

export const metadata = { title: "My Events & Tickets" };

export default async function MyEventsPage() {
  const user = await requireUser("/my/events");
  const now = new Date();
  const [regs, attended] = await Promise.all([
    db.eventRegistration.findMany({ where: { userId: user.id }, include: { event: { include: { club: true } } }, orderBy: { event: { startsAt: "asc" } } }),
    db.eventAttendance.findMany({ where: { userId: user.id }, select: { eventId: true } }),
  ]);
  const att = new Set(attended.map((a) => a.eventId));
  const upcoming = regs.filter((r) => r.event.endsAt >= now && r.status !== "CANCELLED");
  const past = regs.filter((r) => r.event.endsAt < now).reverse();
  return (
    <>
      <PageHeader title="My Events & Tickets" />
      <Container className="space-y-10 py-10">
        <section>
          <SectionHeading title="Upcoming" />
          {upcoming.length === 0 ? <EmptyState title="No upcoming registrations"><Link href="/events" className="underline">Find an event</Link></EmptyState> : (
            <ul className="grid gap-3">
              {upcoming.map((r) => (
                <li key={r.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">{r.event.club.shortName} · {formatDateTime(r.event.startsAt)}</p>
                      <Link href={`/events/${r.eventId}`} className="font-semibold hover:underline">{r.event.title}</Link>
                      {r.event.status === "CANCELLED" && <Badge tone="red" className="ml-2">Cancelled</Badge>}
                    </div>
                    {r.status === "REGISTERED" ? <Link href={`/tickets/${r.ticketCode}`} className="text-sm font-semibold text-brand-700 underline">QR ticket</Link> : <Badge tone="gold">Waitlisted</Badge>}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <SectionHeading title="Past" />
          {past.length === 0 ? <EmptyState title="No past events yet" /> : (
            <ul className="divide-y divide-brand-100 rounded-2xl bg-white ring-1 ring-brand-100">
              {past.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div><Link href={`/events/${r.eventId}`} className="font-medium hover:underline">{r.event.title}</Link><p className="text-xs text-muted">{formatDateTime(r.event.startsAt)}</p></div>
                  {att.has(r.eventId) ? <Badge tone="green">Attended</Badge> : <Badge tone="gray">{r.status === "CANCELLED" ? "Cancelled" : "Not checked in"}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </>
  );
}
