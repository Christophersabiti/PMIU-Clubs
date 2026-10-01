import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, CLUB_ROLES, isChapterAdmin, requireAdmin, ROLE_LABELS } from "@/lib/permissions";
import { assignClubRole, linkClubPartner, removeClubRole, unlinkClubPartner } from "@/app/actions/admin";
import { AdminTitle, Created } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Input, Select } from "@/components/ui";
import { ClubForm } from "../ClubForm";

export const metadata = { title: "Manage club" };

export default async function ManageClub({ params, searchParams }: PageProps<"/admin/clubs/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  if (!can(user, "club.edit", id)) redirect("/admin/clubs");
  const club = await db.club.findUnique({ where: { id }, include: { roles: { include: { user: true } }, partners: { include: { partner: true } } } });
  if (!club) notFound();
  const chapter = isChapterAdmin(user);
  const partners = await db.partner.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <AdminTitle title={club.name} back={{ href: "/admin/clubs", label: "Clubs" }} action={<Link href={`/clubs/${club.slug}`} className="text-sm text-brand-700 underline">View public page →</Link>} />
      <Created show={!!sp.created} label="Club created" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <ClubForm club={club} canToggleActive={chapter} />
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl font-semibold">Leadership & roles</h2>
            <ul className="mt-3 divide-y divide-brand-100">
              {club.roles.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div><p className="font-medium">{r.user.name}</p><p className="text-xs text-muted">{r.title ?? ROLE_LABELS[r.role]} · {r.user.email}</p></div>
                  {chapter && <form action={removeClubRole}><input type="hidden" name="id" value={r.id} /><button className="text-xs text-red-700 underline">Remove</button></form>}
                </li>
              ))}
              {club.roles.length === 0 && <li className="py-2 text-sm text-muted">No leaders assigned.</li>}
            </ul>
            {chapter ? (
              <ActionForm action={assignClubRole} className="mt-4 space-y-3 border-t border-brand-100 pt-4" resetOnSuccess>
                <input type="hidden" name="clubId" value={club.id} />
                <Input label="Member email" name="email" type="email" required />
                <Select label="Role" name="role" options={CLUB_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
                <Input label="Display title" name="title" placeholder="Club Captain" />
                <SubmitButton size="sm">Assign role</SubmitButton>
              </ActionForm>
            ) : <p className="mt-3 text-xs text-muted">Roles are assigned by the chapter admin.</p>}
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">Partners</h2>
            <ul className="mt-3 divide-y divide-brand-100">
              {club.partners.map((cp) => (
                <li key={cp.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div><p className="font-medium">{cp.partner.name} {cp.partner.status === "PROSPECT" && <Badge tone="gray">prospect</Badge>}</p><p className="text-xs text-muted">{cp.memberBenefit}</p></div>
                  <form action={unlinkClubPartner}><input type="hidden" name="id" value={cp.id} /><button className="text-xs text-red-700 underline">Unlink</button></form>
                </li>
              ))}
            </ul>
            <ActionForm action={linkClubPartner} className="mt-4 space-y-3 border-t border-brand-100 pt-4">
              <input type="hidden" name="clubId" value={club.id} />
              <Select label="Partner" name="partnerId" options={partners.map((p) => ({ value: p.id, label: p.name }))} />
              <Input label="Relationship" name="relationship" defaultValue="Strategic partner" />
              <Input label="What the partner provides" name="provides" />
              <Input label="Member benefit" name="memberBenefit" />
              <SubmitButton size="sm">Link / update partner</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
