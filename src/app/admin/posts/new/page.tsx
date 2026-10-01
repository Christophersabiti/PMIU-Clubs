import { isChapterAdmin, manageableClubs, requireAdmin } from "@/lib/permissions";
import { AdminTitle } from "@/components/admin";
import { PostForm } from "../PostForm";

export const metadata = { title: "Create post" };

export default async function NewPost() {
  const user = await requireAdmin();
  const clubs = await manageableClubs(user, "partnerContent.manage");
  return (<><AdminTitle title="Create post" back={{ href: "/admin/posts", label: "Posts" }} /><PostForm clubs={clubs} allowChapterWide={isChapterAdmin(user)} /></>);
}
