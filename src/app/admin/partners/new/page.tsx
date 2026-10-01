import { requireChapterAdmin } from "@/lib/permissions";
import { AdminTitle } from "@/components/admin";
import { PartnerForm } from "../PartnerForm";

export const metadata = { title: "Add partner" };

export default async function NewPartner() {
  await requireChapterAdmin();
  return (<><AdminTitle title="Add partner" back={{ href: "/admin/partners", label: "Partners" }} /><PartnerForm /></>);
}
