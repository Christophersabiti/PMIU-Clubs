import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/permissions";
import { formatDateTime, formatTime } from "@/lib/utils";
import { toggleAttendance, walkInCheckIn } from "@/app/actions/admin";
import { AdminTitle, Table, td } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, ButtonLink, Card, Input, Stat } from "@/components/ui";

export const metadata = { title: "Attendance" };

export default async function Attendance({ params }: PageProps<"/admin/events/[id]/attendance">) {
  const { id } = await params;
  const user = await requireAdmin();
  const event = await db.event.findUnique({ where: { id }, include: { club: true } });
  if (!event) notFound();
  if (!can(user, "attendance.manage", event.clubId)) redirect("/admin");
  const [regs, attendance] = await Promise.all([
    db.eventRegistration.findMany({ where: { eventId: id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    db.eventAttendance.findMany({ where: { eventId: id }, include: { user: true } }),
  ]);
  const att = new Map(attendance.map((a) => [a.userId, a]));
  const registered = regs.filter((r) => r.status === "REGISTERED");
  const walkIns = attendance.filter((a) => !regs.some((r) => r.userId === a.userId));
  const rate = registered.length ? Math.round((registered.filter((r) => att.has(r.userId)).length / registered.length) * 100) : 0;

  return (
    <>
      <AdminTitle title={`Attendance · ${event.title}`} subtitle={`${event.club.shortName} · ${formatDateTime(event.startsAt)}`} back={{ href: `/admin/events/${id}`, label: "Event" }}
        action={<div className="flex gap-2"><ButtonLink href={`/admin/checkin?event=${id}`}>Open QR scanner</ButtonLink><a href={`/api/admin/export?type=attendance&event=${id}`} className="self-center text-sm text-brand-700 underline">Export CSV</a></div>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={registered.length} label="Registered" />
        <Stat value={regs.filter((r) => r.status === "WAITLISTED").length} label="Waitlisted" />
        <Stat value={attendance.length} label="Checked in" hint={`${walkIns.length} walk-ins`} />
        <Stat value={`${rate}%`} label="Attendance rate" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
        <Table head={["Member", "Registration", "Ticket", "Check-in", ""]} empty={regs.length === 0}>
          {[...regs.map((r) => ({ key: r.id, user: r.user, status: r.status, ticket: r.ticketCode })), ...walkIns.map((a) => ({ key: a.id, user: a.user, status: "WALK-IN", ticket: "" }))].map((row) => {
            const a = att.get(row.user.id);
            return (
              <tr key={row.key}>
                <td className={td}><p className="font-medium">{row.user.name}</p><p className="text-xs text-muted">{row.user.email}</p></td>
                <td className={td}><Badge tone={row.status === "REGISTERED" ? "green" : row.status === "WAITLISTED" ? "gold" : row.status === "WALK-IN" ? "blue" : "gray"}>{row.status.toLowerCase()}</Badge></td>
                <td className={td}>{row.ticket && <Link href={`/tickets/${row.ticket}`} className="font-mono text-xs underline">{row.ticket}</Link>}</td>
                <td className={td}>{a ? <span className="text-emerald-700">✓ {formatTime(a.checkedInAt)} <span className="text-xs text-muted">({a.method.toLowerCase()})</span></span> : <span className="text-muted">—</span>}</td>
                <td className={td}>
                  {row.status !== "CANCELLED" && (
                    <form action={toggleAttendance}>
                      <input type="hidden" name="eventId" value={id} /><input type="hidden" name="userId" value={row.user.id} />
                      <button className="text-xs font-semibold text-brand-700 underline">{a ? "Undo" : "Check in"}</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
        <Card>
          <h2 className="font-display text-lg font-semibold">Walk-in check-in</h2>
          <p className="text-xs text-muted">For members who attended without registering.</p>
          <ActionForm action={walkInCheckIn} className="mt-3 space-y-3" resetOnSuccess>
            <input type="hidden" name="eventId" value={id} />
            <Input label="Member email" name="email" type="email" required />
            <SubmitButton size="sm">Check in</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
