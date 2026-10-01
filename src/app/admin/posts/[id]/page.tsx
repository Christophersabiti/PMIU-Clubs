import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, isChapterAdmin, manageableClubs, requireAdmin } from "@/lib/permissions";
import { deletePost } from "@/app/actions/admin";
import { AdminTitle, Created } from "@/components/admin";
import { ConfirmButton } from "@/components/ConfirmButton";
import { btn } from "@/components/ui";
import { PostForm } from "../PostForm";

export const metadata = { title: "Edit post" };

export default async function EditPost({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();
  if (!can(user, post.type === "NEWS" ? "partnerContent.manage" : "content.manage", post.clubId)) redirect("/admin/posts");
  const clubs = await manageableClubs(user, "partnerContent.manage");
  return (
    <>
      <AdminTitle title={post.title} back={{ href: "/admin/posts", label: "Posts" }} action={post.published && <Link href={`/news/${post.slug}`} className="text-sm text-brand-700 underline">View →</Link>} />
      <Created show={!!sp.created} label="Post created" />
      <PostForm post={post} clubs={clubs} allowChapterWide={isChapterAdmin(user)} />
      <form action={deletePost} className="mt-10 border-t border-brand-100 pt-6">
        <input type="hidden" name="id" value={id} />
        <ConfirmButton message="Delete this post permanently?" className={`${btn.base} ${btn.danger} ${btn.sm}`}>Delete post</ConfirmButton>
      </form>
    </>
  );
}
