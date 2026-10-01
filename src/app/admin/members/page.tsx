import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { can, clubsWith, GLOBAL_ROLES, requireAdmin, ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { decideMembership } from "@/app/actions/admin";
import { AdminTitle, Table, td } from "@/components/admin";
import { FilterBar } from "@/components/FilterBar";
import { Badge } from "@/components/ui";
import { RoleSelect } from "./RoleSelect";

export const metadata = { title: "Members" };

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const platformAdmin = user.globalRole === "SUPER_ADMIN";
  const scope = clubsWith(user, "members.manage");
  const where: Prisma.UserWhereInput = {};
  if (scope) where.memberships = { some: { clubId: { in: scope }, status: { in: ["ACTIVE", "PENDING"] } } };
  if (sp.club) where.AND = [{ memberships: { some: { club: { slug: sp.club }, status: "ACTIVE" } } }];
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { organization: { contains: sp.q, mode: "insensitive" } }];
  if (sp.pmi === "yes") where.isPmiMember = true;
  if (sp.pmi === "no") where.isPmiMember = false;
  const [users, clubs] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 300, include: { memberships: { where: { status: { in: ["ACTIVE", "PENDING"] } }, include: { club: true } }, clubRoles: true } }),
    db.club.findMany({ where: scope ? { id: { in: scope } } : {}, orderBy: { sortOrder: "asc" } }),
  ]);
  const roleOptions = GLOBAL_ROLES.filter((r) => r !== "SUPER_ADMIN" || user.globalRole === "SUPER_ADMIN").map((r) => ({ value: r, label: ROLE_LABELS[r] }));

  return (
    <>
      <AdminTitle title="Members" subtitle={`${users.length} shown`} action={<a href="/api/admin/export?type=members" className="text-sm font-semibold text-brand-700 underline">Export CSV</a>} />
      <FilterBar action="/admin/members" q={sp.q ?? ""} placeholder="Name, email, organisation" filters={[
        { name: "club", label: "Club", value: sp.club, options: clubs.map((c) => ({ value: c.slug, label: c.shortName })) },
        { name: "pmi", label: "PMI member", value: sp.pmi, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      ]} />
      <div className="mt-6">
        <Table head={["Member", "Clubs", "PMI", "Joined", ...(platformAdmin ? ["Platform role"] : [])]} empty={users.length === 0}>
          {users.map((u) => (
            <tr key={u.id}>
              <td className={td}>
                <Link href={`/members/${u.id}`} className="font-semibold hover:underline">{u.name}</Link>
                <p className="text-xs text-muted">{u.email}</p>
                {u.clubRoles.length > 0 && <p className="mt-1 text-[11px] text-brand-700">{u.clubRoles.map((r) => ROLE_LABELS[r.role]).join(", ")}</p>}
              </td>
              <td className={td}>
                <ul className="space-y-1">
                  {u.memberships.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <Badge tone={m.status === "PENDING" ? "gold" : "gray"}>{m.club.shortName}{m.status === "PENDING" && " · pending"}</Badge>
                      {can(user, "members.manage", m.clubId) && m.status === "ACTIVE" && (
                        <form action={decideMembership}>
                          <input type="hidden" name="id" value={m.id} /><input type="hidden" name="decision" value="REMOVED" />
                          <button className="text-[11px] text-red-700 underline" aria-label={`Remove ${u.name} from ${m.club.shortName}`}>remove</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </td>
              <td className={td}>{u.isPmiMember ? <span>{u.pmiMemberId ?? "Yes"}<br /><span className="text-xs text-muted">{u.certifications}</span></span> : <span className="text-muted">No</span>}</td>
              <td className={td}>{formatDate(u.createdAt)}</td>
              {platformAdmin && <td className={td}><RoleSelect userId={u.id} role={u.globalRole} options={roleOptions} /></td>}
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}
