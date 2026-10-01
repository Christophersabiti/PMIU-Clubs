import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PostCard, POST_TYPES } from "@/components/cards";
import { FilterBar } from "@/components/FilterBar";
import { Container, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "News & Updates" };

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const where: Prisma.PostWhereInput = { published: true };
  if (sp.type) where.type = sp.type;
  if (sp.club) where.club = { slug: sp.club };
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { excerpt: { contains: sp.q, mode: "insensitive" } }];
  const [posts, clubs, galleries] = await Promise.all([
    db.post.findMany({ where, include: { club: true }, orderBy: { publishedAt: "desc" } }),
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.gallery.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 4, include: { club: true, images: { take: 1 }, _count: { select: { images: true } } } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Updates" title="News & Announcements" />
      <Container className="py-10">
        <FilterBar action="/news" q={sp.q ?? ""} filters={[
          { name: "type", label: "Type", value: sp.type, options: Object.entries(POST_TYPES).map(([value, label]) => ({ value, label })) },
          { name: "club", label: "Club", value: sp.club, options: clubs.map((c) => ({ value: c.slug, label: c.shortName })) },
        ]} />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
        {posts.length === 0 && <EmptyState title="No posts found" />}
        {galleries.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 font-display text-2xl font-semibold">Photo galleries</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleries.map((g) => (
                <a key={g.id} href={`/gallery/${g.id}`} className="overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100 hover:shadow-md">
                  {g.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/media/${g.images[0].mediaId}`} alt="" className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-3"><p className="font-semibold">{g.title}</p><p className="text-xs text-muted">{g.club?.shortName} · {g._count.images} photos</p></div>
                </a>
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
