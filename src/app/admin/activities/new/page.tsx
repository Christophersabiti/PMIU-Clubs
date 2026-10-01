import { requireAdmin } from "@/lib/permissions";
import { AdminTitle } from "@/components/admin";
import { ActivityForm } from "../ActivityForm";
import { programmeOptions } from "../options";

export const metadata = { title: "New activity" };

export default async function NewActivity() {
  const user = await requireAdmin();
  const o = await programmeOptions(user, "content.manage");
  return (
    <>
      <AdminTitle title="New activity" back={{ href: "/admin/activities", label: "Activities" }} />
      <ActivityForm clubs={o.clubs} initiatives={o.initiatives} partners={o.partners} />
    </>
  );
}
