import Link from "next/link";
import { db } from "@/lib/db";
import { clubsWith, requireAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { POST_TYPES } from "@/components/cards";
import { AdminTitle, NewButton, Table, td } from "@/components/admin";
import { Badge } from "@/components/ui";

export const metadata = { title: "News & Announcements" };

export default async function AdminPosts() {
  const user = await requireAdmin();
  const ids = clubsWith(user, "partnerContent.manage");
  const posts = await db.post.findMany({ where: ids ? { clubId: { in: ids } } : {}, include: { club: true, author: true }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <AdminTitle title="News, announcements & impact stories" action={<NewButton href="/admin/posts/new">Create</NewButton>} />
      <Table head={["Title", "Type", "Club", "Author", "Published", "Views"]} empty={posts.length === 0}>
        {posts.map((p) => (
          <tr key={p.id}>
            <td className={td}><Link href={`/admin/posts/${p.id}`} className="font-semibold text-brand-800 hover:underline">{p.title}</Link></td>
            <td className={td}><Badge tone={p.type === "ANNOUNCEMENT" ? "gold" : p.type === "IMPACT_STORY" ? "green" : "brand"}>{POST_TYPES[p.type]}</Badge></td>
            <td className={td}>{p.club?.shortName ?? "Chapter-wide"}</td>
            <td className={td}>{p.author?.name}</td>
            <td className={td}>{p.published ? formatDate(p.publishedAt) : <Badge tone="gray">draft</Badge>}</td>
            <td className={td}>{p.views}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
