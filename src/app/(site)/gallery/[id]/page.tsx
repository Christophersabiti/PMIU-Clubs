import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, mediaUrl } from "@/lib/utils";
import { Container } from "@/components/ui";
import { ShareButton } from "./ShareButton";

export async function generateMetadata({ params }: PageProps<"/gallery/[id]">) {
  const { id } = await params;
  const g = await db.gallery.findUnique({ where: { id } });
  return { title: g?.title ?? "Gallery" };
}

export default async function GalleryPage({ params }: PageProps<"/gallery/[id]">) {
  const { id } = await params;
  const g = await db.gallery.findUnique({ where: { id }, include: { club: true, event: true, images: { orderBy: { sortOrder: "asc" }, include: { media: true } } } });
  if (!g || !g.published) notFound();
  return (
    <>
      <section className="hero-bg text-white">
        <Container className="py-12">
          <p className="text-sm text-brand-200">
            {g.club && <Link href={`/clubs/${g.club.slug}`} className="hover:underline">{g.club.name}</Link>}
            {g.event && <> · <Link href={`/events/${g.event.id}`} className="hover:underline">{g.event.title}</Link></>}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{g.title}</h1>
          <p className="mt-2 text-brand-100">{g.images.length} photos · {formatDate(g.createdAt)}</p>
          {g.description && <p className="mt-2 max-w-2xl text-brand-100">{g.description}</p>}
          <div className="mt-5"><ShareButton title={g.title} /></div>
        </Container>
      </section>
      <Container className="py-10">
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {g.images.map((im) => (
            <li key={im.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
              <a href={mediaUrl(im.mediaId)!} target="_blank" rel="noreferrer" aria-label={`Open photo${im.caption ? `: ${im.caption}` : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(im.mediaId)!} alt={im.caption ?? im.media.alt ?? ""} loading="lazy" className="w-full" />
              </a>
              {im.caption && <p className="p-3 text-sm">{im.caption}</p>}
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
