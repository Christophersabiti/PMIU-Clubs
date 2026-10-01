import Link from "next/link";
import { db } from "@/lib/db";
import { clubScope, requireAdmin } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { decideMembership } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin";
import { Badge, Card, EmptyState, btn } from "@/components/ui";

export const metadata = { title: "Applications" };

export default async function Applications() {
  const user = await requireAdmin();
  const pending = await db.clubMembership.findMany({
    where: { status: "PENDING", ...clubScope(user, "members.manage") },
    include: { user: true, club: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <>
      <AdminTitle title="Join requests" subtitle="Clubs that require approval send requests here." />
      {pending.length === 0 ? <EmptyState title="No pending requests 🎉" /> : (
        <ul className="grid gap-4 md:grid-cols-2">
          {pending.map((m) => (
            <li key={m.id}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/members/${m.userId}`} className="font-semibold hover:underline">{m.user.name}</Link>
                    <p className="text-xs text-muted">{m.user.email} · {[m.user.jobTitle, m.user.organization].filter(Boolean).join(", ")}</p>
                  </div>
                  <Badge tone="brand">{m.club.shortName}</Badge>
                </div>
                {m.user.isPmiMember && <p className="mt-2 text-xs">PMI member {m.user.pmiMemberId && `· ID ${m.user.pmiMemberId}`} {m.user.certifications && `· ${m.user.certifications}`}</p>}
                {m.motivation && <blockquote className="mt-3 rounded-xl bg-brand-50 p-3 text-sm">“{m.motivation}”</blockquote>}
                <p className="mt-2 text-xs text-muted">Requested {formatDateTime(m.createdAt)}</p>
                <div className="mt-4 flex gap-2">
                  <form action={decideMembership}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="decision" value="ACTIVE" /><button className={`${btn.base} ${btn.primary} ${btn.sm}`}>Approve</button></form>
                  <form action={decideMembership}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="decision" value="REJECTED" /><button className={`${btn.base} ${btn.outline} ${btn.sm}`}>Decline</button></form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
