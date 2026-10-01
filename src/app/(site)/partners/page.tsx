import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, lines } from "@/lib/utils";
import { Badge, Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Partners" };

export default async function PartnersPage() {
  const partners = await db.partner.findMany({
    where: { status: { not: "INACTIVE" } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { clubs: { include: { club: true } }, _count: { select: { activities: true, events: true } } },
  });
  return (
    <>
      <PageHeader eyebrow="Partner expertise" title="Partners" intro="Organisations that bring complementary expertise to PMI Uganda clubs — and turn partnerships into real experiences for members." />
      <Container className="grid gap-5 py-10 md:grid-cols-2">
        {partners.map((p) => (
          <article key={p.id} className="relative flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-brand-100 hover:shadow-md">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 font-display text-2xl font-semibold text-brand-800">
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt="" className="h-full w-full object-contain" />
              ) : p.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-brand-950"><Link href={`/partners/${p.slug}`} className="after:absolute after:inset-0">{p.name}</Link></h2>
                {p.status === "PROSPECT" && <Badge tone="gray">To be confirmed</Badge>}
              </div>
              <p className="text-xs text-brand-600">Partner of {p.clubs.map((c) => c.club.name).join(", ")}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{lines(p.expertise).slice(0, 4).map((e) => <Badge key={e} tone="brand">{e}</Badge>)}</div>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted">
                {p._count.activities} activities · {p._count.events} events{p.activeSince && <> · since {formatDate(p.activeSince)}</>}
                <ArrowRight className="ml-auto h-4 w-4 text-brand-600" aria-hidden />
              </p>
            </div>
          </article>
        ))}
      </Container>
    </>
  );
}
