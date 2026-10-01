import { requireChapterAdmin } from "@/lib/permissions";
import { AdminTitle } from "@/components/admin";
import { ClubForm } from "../ClubForm";

export const metadata = { title: "Create club" };

export default async function NewClub() {
  await requireChapterAdmin();
  return (
    <>
      <AdminTitle title="Create club" back={{ href: "/admin/clubs", label: "Clubs" }} subtitle="Every club uses the same page template — content here produces a new club page automatically." />
      <ClubForm />
    </>
  );
}
