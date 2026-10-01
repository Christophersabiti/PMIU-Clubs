import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/utils";
import { FilterBar } from "@/components/FilterBar";
import { Avatar, Container, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Member Directory" };

export default async function DirectoryPage({ searchParams }: PageProps<"/directory">) {
  await requireUser("/directory");
  const sp = (await searchParams) as Record<string, string | undefined>;
  const where: Prisma.UserWhereInput = { showInDirectory: true };
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { organization: { contains: sp.q, mode: "insensitive" } }, { skills: { contains: sp.q, mode: "insensitive" } }, { jobTitle: { contains: sp.q, mode: "insensitive" } }];
  if (sp.club) where.memberships = { some: { status: "ACTIVE", club: { slug: sp.club } }, };
  const [users, clubs] = await Promise.all([
    db.user.findMany({ where, orderBy: { name: "asc" }, take: 200, include: { memberships: { where: { status: "ACTIVE" }, include: { club: true } } } }),
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Member Directory" intro="Members who chose to be listed. Visibility of details follows each member's privacy settings." />
      <Container className="py-10">
        <FilterBar action="/directory" q={sp.q ?? ""} placeholder="Name, organisation, skill" filters={[{ name: "club", label: "Club", value: sp.club, options: clubs.map((c) => ({ value: c.slug, label: c.shortName })) }]} />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <li key={u.id} className="relative flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100 hover:shadow-md">
              <Avatar name={u.name} src={mediaUrl(u.photoId)} size={48} />
              <div className="min-w-0">
                <Link href={`/members/${u.id}`} className="font-semibold after:absolute after:inset-0 hover:underline">{u.name}</Link>
                <p className="truncate text-xs text-muted">{[u.certifications, u.jobTitle].filter(Boolean).join(" · ")}</p>
                {u.showClubs && <p className="truncate text-xs text-brand-600">{u.memberships.map((m) => m.club.shortName).join(" · ")}</p>}
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && <EmptyState title="No members found" />}
      </Container>
    </>
  );
}
