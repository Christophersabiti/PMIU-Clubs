import Link from "next/link";
import { db } from "@/lib/db";
import { clubScope, requireAdmin } from "@/lib/permissions";
import { formatTime } from "@/lib/utils";
import { AdminTitle } from "@/components/admin";
import { Card } from "@/components/ui";
import { Scanner } from "./Scanner";

export const metadata = { title: "QR Check-in" };

export default async function CheckIn({ searchParams }: PageProps<"/admin/checkin">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const now = new Date();
  const start = new Date(now.getTime() - 12 * 3600_000);
  const end = new Date(now.getTime() + 24 * 3600_000);
  const today = await db.event.findMany({
    where: { ...clubScope(user, "attendance.manage"), startsAt: { lte: end }, endsAt: { gte: start }, status: "PUBLISHED" },
    include: { club: true, _count: { select: { attendance: true, registrations: { where: { status: "REGISTERED" } } } } },
    orderBy: { startsAt: "asc" },
  });
  return (
    <>
      <AdminTitle title="QR Check-in" subtitle="Scan → validate registration → identify member → check in → attendance stored." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card><Scanner initialCode={sp.code} /></Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">Happening now / next 24h</h2>
          {today.length === 0 && <p className="mt-2 text-sm text-muted">No events in this window.</p>}
          <ul className="mt-3 space-y-3 text-sm">
            {today.map((e) => (
              <li key={e.id} className={sp.event === e.id ? "rounded-xl bg-brand-50 p-2" : ""}>
                <Link href={`/admin/events/${e.id}/attendance`} className="font-semibold hover:underline">{e.title}</Link>
                <p className="text-xs text-muted">{e.club.shortName} · {formatTime(e.startsAt)} · {e._count.attendance}/{e._count.registrations} checked in</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
