import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ResourceItem } from "@/components/cards";
import { Container, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Resources" };

const TABS = [
  { v: "", l: "All" },
  { v: "ARTICLE", l: "Articles" },
  { v: "VIDEO", l: "Videos" },
  { v: "DOCUMENT", l: "Documents" },
  { v: "TEMPLATE", l: "Templates" },
  { v: "partner", l: "Partner Resources" },
  { v: "LINK", l: "Links" },
];

export default async function ResourcesPage({ searchParams }: PageProps<"/resources">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await getCurrentUser();
  const where: Prisma.ResourceWhereInput = { published: true };
  if (!user) where.membersOnly = false;
  if (sp.type === "partner") where.isPartnerResource = true;
  else if (sp.type) where.type = sp.type;
  if (sp.club) where.club = { slug: sp.club };
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { description: { contains: sp.q, mode: "insensitive" } }];
  const [resources, clubs] = await Promise.all([
    db.resource.findMany({ where, include: { club: true, partner: true }, orderBy: { createdAt: "desc" } }),
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/resources${p.size ? `?${p}` : ""}`;
  };
  return (
    <>
      <PageHeader eyebrow="Library" title="Resources" intro="Guides, templates, videos and partner resources from every club." />
      <Container className="py-10">
        <div className="flex flex-wrap gap-2" role="navigation" aria-label="Resource type">
          {TABS.map((t) => (
            <Link key={t.l} href={qs({ type: t.v })} aria-current={(sp.type ?? "") === t.v ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 text-sm font-medium ring-1", (sp.type ?? "") === t.v ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-brand-800 ring-brand-200 hover:bg-brand-50")}>
              {t.l}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Club">
          <Link href={qs({ club: "" })} className={cn("rounded-full px-3 py-1 text-xs font-medium", !sp.club ? "bg-gold-400 text-brand-950" : "bg-brand-50 text-brand-800")}>All clubs</Link>
          {clubs.map((c) => (
            <Link key={c.id} href={qs({ club: c.slug })} className={cn("rounded-full px-3 py-1 text-xs font-medium", sp.club === c.slug ? "bg-gold-400 text-brand-950" : "bg-brand-50 text-brand-800")}>{c.shortName}</Link>
          ))}
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {resources.map((r) => <ResourceItem key={r.id} resource={r} />)}
        </ul>
        {resources.length === 0 && <EmptyState title="No resources found" />}
        {!user && <p className="mt-6 text-sm text-muted"><Link href="/login?next=/resources" className="underline">Sign in</Link> to see members-only resources.</p>}
      </Container>
    </>
  );
}
