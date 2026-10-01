import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { appUrl, formatDay, formatTime } from "@/lib/utils";
import { Badge, Container } from "@/components/ui";

export const metadata = { title: "My ticket" };

export default async function TicketPage({ params }: PageProps<"/tickets/[code]">) {
  const { code } = await params;
  const user = await requireUser(`/tickets/${code}`);
  const reg = await db.eventRegistration.findUnique({ where: { ticketCode: code }, include: { event: { include: { club: true } }, user: true } });
  if (!reg || (reg.userId !== user.id && !can(user, "attendance.manage", reg.event.clubId))) notFound();
  const attended = await db.eventAttendance.findUnique({ where: { eventId_userId: { eventId: reg.eventId, userId: reg.userId } } });
  // The QR encodes the check-in URL so an event coordinator can scan it with any phone camera.
  const svg = await QRCode.toString(appUrl(`/admin/checkin?code=${reg.ticketCode}`), { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1c0742", light: "#ffffff" } });

  return (
    <Container className="max-w-md py-10">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-brand-100">
        <div className="hero-bg p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{reg.event.club.shortName} · Ticket</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">{reg.event.title}</h1>
          <p className="mt-2 text-sm text-brand-100">{formatDay(reg.event.startsAt)} · {formatTime(reg.event.startsAt)}</p>
          {reg.event.locationName && <p className="text-sm text-brand-100">{reg.event.locationName}</p>}
        </div>
        <div className="p-6 text-center">
          {reg.status !== "REGISTERED" ? (
            <Badge tone={reg.status === "WAITLISTED" ? "gold" : "red"} className="text-sm">{reg.status === "WAITLISTED" ? "Waitlisted — no ticket yet" : "Registration cancelled"}</Badge>
          ) : (
            <>
              <div className="mx-auto w-64" role="img" aria-label={`QR code for ticket ${reg.ticketCode}`} dangerouslySetInnerHTML={{ __html: svg }} />
              <p className="mt-3 font-mono text-sm tracking-widest text-muted">{reg.ticketCode}</p>
              <p className="mt-1 font-semibold">{reg.user.name}</p>
              {attended ? <Badge tone="green" className="mt-3 text-sm">✓ Checked in</Badge> : <p className="mt-3 text-sm text-muted">Show this QR code at check-in.</p>}
            </>
          )}
          <Link href={`/events/${reg.eventId}`} className="mt-6 block text-sm text-brand-700 underline">Event details</Link>
        </div>
      </div>
    </Container>
  );
}
