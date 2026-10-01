import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, lines, youtubeEmbed } from "@/lib/utils";
import { POST_TYPES } from "@/components/cards";
import { Badge, Container } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const p = await db.post.findUnique({ where: { slug } });
  return { title: p?.title ?? "News", description: p?.excerpt ?? undefined };
}

export default async function PostPage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const post = await db.post.findUnique({ where: { slug }, include: { club: true, author: true } });
  if (!post || !post.published) notFound();
  await db.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
  const video = youtubeEmbed(post.youtubeUrl);
  return (
    <article>
      <header className="hero-bg text-white">
        <Container className="max-w-3xl py-12">
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold">{POST_TYPES[post.type]}</Badge>
            {post.club && <Link href={`/clubs/${post.club.slug}`}><Badge tone="brand">{post.club.shortName}</Badge></Link>}
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{post.title}</h1>
          <p className="mt-3 text-sm text-brand-200">{formatDate(post.publishedAt ?? post.createdAt)}{post.author && <> · {post.author.name}</>}</p>
        </Container>
      </header>
      <Container className="max-w-3xl py-10">
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="" className="mb-8 max-h-96 w-full rounded-2xl object-cover" />
        )}
        {post.excerpt && <p className="mb-6 font-display text-xl text-brand-900">{post.excerpt}</p>}
        <div className="prose-body text-[16px]">{lines(post.body).map((p, i) => <p key={i}>{p}</p>)}</div>
        {video && (
          <div className="mt-8 aspect-video overflow-hidden rounded-2xl">
            <iframe src={video} title={`Video: ${post.title}`} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
          </div>
        )}
      </Container>
    </article>
  );
}
