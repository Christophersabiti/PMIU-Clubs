import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Clock, Globe2, MapPin, QrCode, Ticket, User, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDateTime, formatDay, formatTime, lines } from "@/lib/utils";
import { Badge, ButtonLink, Card, Container, btn } from "@/components/ui";
import { CancelButton, RegisterButton } from "./RegisterPanel";

export async function generateMetadata({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const e = await db.event.findUnique({ where: { id } });
  return { title: e?.title ?? "Event", description: e?.summary ?? undefined };
}

function gcalLink(e: { title: string; startsAt: Date; endsAt: Date; summary: string | null; locationName: string | null }) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${f(e.startsAt)}/${f(e.endsAt)}`, details: e.summary ?? "", location: e.locationName ?? "" });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { club: true, partner: true, initiative: true, activity: true, galleries: { where: { published: true } } },
  });
  if (!event || event.status === "DRAFT") notFound();
  const user = await getCurrentUser();
  const [reg, taken, attended] = await Promise.all([
    user ? db.eventRegistration.findUnique({ where: { eventId_userId: { eventId: id, userId: user.id } } }) : null,
    db.eventRegistration.count({ where: { eventId: id, status: "REGISTERED" } }),
    user ? db.eventAttendance.findUnique({ where: { eventId_userId: { eventId: id, userId: user.id } } }) : null,
  ]);
  const now = new Date();
  const past = event.endsAt < now;
  const closed = past || event.startsAt < now || (event.registrationDeadline && event.registrationDeadline < now) || event.status === "CANCELLED";
  const full = event.capacity != null && taken >= event.capacity;
  const active = reg && reg.status !== "CANCELLED";

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 text-white">
        {event.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 to-brand-950/50" />
        <Container className="relative py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-brand-200">
            <Link href={`/clubs/${event.club.slug}`} className="hover:underline">{event.club.name}</Link>
            {event.initiative && <> / {event.initiative.title}</>}
            {event.activity && <> / <Link href={`/activities/${event.activity.id}`} className="hover:underline">{event.activity.title}</Link></>}
          </nav>
          <div className="mt-3 flex flex-wrap gap-2">
            {event.status === "CANCELLED" && <Badge tone="red">Cancelled</Badge>}
            {event.isVolunteer && <Badge tone="gold">Volunteer activity</Badge>}
            {past && <Badge tone="gray">Past event</Badge>}
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">{event.title}</h1>
          {event.summary && <p className="mt-3 max-w-2xl text-lg text-brand-100">{event.summary}</p>}
        </Container>
      </section>

      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3"><Clock className="h-5 w-5 text-brand-600" aria-hidden /><div><dt className="text-xs text-muted">When</dt><dd className="font-medium">{formatDay(event.startsAt)}<br />{formatTime(event.startsAt)} – {formatTime(event.endsAt)} (EAT)</dd></div></div>
              <div className="flex gap-3">
                {event.mode === "ONLINE" ? <Globe2 className="h-5 w-5 text-brand-600" aria-hidden /> : <MapPin className="h-5 w-5 text-brand-600" aria-hidden />}
                <div>
                  <dt className="text-xs text-muted">Where</dt>
                  <dd className="font-medium">
                    {event.mode === "ONLINE" ? "Online" : event.locationName}
                    {event.mode === "HYBRID" && " · also online"}
                    {event.mapUrl && <><br /><a href={event.mapUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-700 underline">Open in Google Maps</a></>}
                  </dd>
                </div>
              </div>
              {event.facilitator && <div className="flex gap-3"><User className="h-5 w-5 text-brand-600" aria-hidden /><div><dt className="text-xs text-muted">Facilitator</dt><dd className="font-medium">{event.facilitator}</dd></div></div>}
              {event.partner && <div className="flex gap-3"><Users className="h-5 w-5 text-brand-600" aria-hidden /><div><dt className="text-xs text-muted">Partner</dt><dd><Link href={`/partners/${event.partner.slug}`} className="font-medium text-brand-700 underline">{event.partner.name}</Link></dd></div></div>}
            </dl>
          </Card>
          {event.description && (
            <Card>
              <h2 className="font-display text-2xl font-semibold">About this event</h2>
              <div className="prose-body mt-3 text-[15px]">{lines(event.description).map((p, i) => <p key={i}>{p}</p>)}</div>
            </Card>
          )}
          {event.galleries.length > 0 && (
            <Card>
              <h2 className="font-display text-2xl font-semibold">Photos</h2>
              <ul className="mt-2">{event.galleries.map((g) => <li key={g.id}><Link href={`/gallery/${g.id}`} className="text-brand-700 underline">{g.title}</Link></li>)}</ul>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="sticky top-20">
            <h2 className="flex items-center gap-2 font-semibold"><Ticket className="h-5 w-5 text-brand-600" aria-hidden />Registration</h2>
            {event.capacity != null && (
              <p className="mt-1 text-sm text-muted">{Math.max(0, event.capacity - taken)} of {event.capacity} places left</p>
            )}
            {event.registrationDeadline && <p className="text-sm text-muted">Closes {formatDateTime(event.registrationDeadline)}</p>}
            <div className="mt-4 space-y-2">
              {attended ? (
                <Badge tone="green" className="px-3 py-1.5 text-sm">✓ You attended this event</Badge>
              ) : active ? (
                <>
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{reg.status === "WAITLISTED" ? "You're on the waitlist" : "Registered ✓"}</p>
                  {reg.status === "REGISTERED" && (
                    <ButtonLink href={`/tickets/${reg.ticketCode}`} className="w-full"><QrCode className="h-4 w-4" aria-hidden />View QR ticket</ButtonLink>
                  )}
                  {!past && <CancelButton eventId={event.id} />}
                </>
              ) : closed ? (
                <p className="rounded-xl bg-gray-100 px-3 py-2 text-sm">{event.status === "CANCELLED" ? "This event was cancelled." : "Registration is closed."}</p>
              ) : event.externalRegistrationUrl ? (
                <a href={event.externalRegistrationUrl} target="_blank" rel="noreferrer" className={`${btn.base} ${btn.gold} w-full`}>Register (external)</a>
              ) : user ? (
                <RegisterButton eventId={event.id} label={full ? "Join the waitlist" : "Register"} />
              ) : (
                <ButtonLink href={`/login?next=/events/${event.id}`} variant="gold" className="w-full">Sign in to register</ButtonLink>
              )}
              {active && event.onlineUrl && !past && reg.status === "REGISTERED" && (
                <a href={event.onlineUrl} target="_blank" rel="noreferrer" className={`${btn.base} ${btn.outline} w-full`}>Join online</a>
              )}
            </div>
            {!past && (
              <div className="mt-5 border-t border-brand-100 pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted"><CalendarPlus className="h-4 w-4" aria-hidden />Add to calendar</p>
                <div className="flex gap-2">
                  <a href={gcalLink(event)} target="_blank" rel="noreferrer" className={`${btn.base} ${btn.outline} ${btn.sm}`}>Google</a>
                  <a href={`/api/events/${event.id}/ics`} className={`${btn.base} ${btn.outline} ${btn.sm}`}>Outlook / Apple (.ics)</a>
                </div>
              </div>
            )}
            {user && can(user, "attendance.manage", event.clubId) && (
              <Link href={`/admin/events/${event.id}/attendance`} className="mt-4 block text-sm text-brand-700 underline">Manage attendance & check-in</Link>
            )}
          </Card>
        </aside>
      </Container>
    </>
  );
}
