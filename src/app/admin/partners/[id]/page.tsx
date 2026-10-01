import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/permissions";
import { AdminTitle, Created } from "@/components/admin";
import { PartnerForm } from "../PartnerForm";

export const metadata = { title: "Edit partner" };

export default async function EditPartner({ params, searchParams }: PageProps<"/admin/partners/[id]">) {
  await requireChapterAdmin();
  const { id } = await params;
  const sp = (await searchParams) as Record<string, string | undefined>;
  const partner = await db.partner.findUnique({ where: { id } });
  if (!partner) notFound();
  return (
    <>
      <AdminTitle title={partner.name} back={{ href: "/admin/partners", label: "Partners" }} action={<Link href={`/partners/${partner.slug}`} className="text-sm text-brand-700 underline">Public page →</Link>} />
      <Created show={!!sp.created} label="Partner created" />
      <PartnerForm partner={partner} />
    </>
  );
}
