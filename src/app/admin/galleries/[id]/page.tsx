import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/permissions";
import { mediaUrl } from "@/lib/utils";
import { updateGalleryImage } from "@/app/actions/admin";
import { AdminTitle, Created } from "@/components/admin";
import { Card, inputCls } from "@/components/ui";
import { GalleryForm } from "../GalleryForm";
import { galleryOptions } from "../options";
import { GalleryUploader } from "./Uploader";

export const metadata = { title: "Edit gallery" };

export default async function EditGallery({ params, searchParams }: PageProps<"/admin/galleries/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const g = await db.gallery.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } });
  if (!g) notFound();
  if (!can(user, "content.manage", g.clubId)) redirect("/admin/galleries");
  return (
    <>
      <AdminTitle title={g.title} back={{ href: "/admin/galleries", label: "Galleries" }} action={<Link href={`/gallery/${g.id}`} className="text-sm text-brand-700 underline">View →</Link>} />
      <Created show={!!sp.created} label="Gallery created" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <GalleryForm gallery={g} {...await galleryOptions(user)} />
        <Card>
          <h2 className="font-display text-xl font-semibold">Upload photos</h2>
          <GalleryUploader galleryId={g.id} />
        </Card>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {g.images.map((im) => (
          <li key={im.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(im.mediaId)!} alt={im.caption ?? ""} className="aspect-square w-full object-cover" />
            <form action={updateGalleryImage} className="space-y-2 p-2">
              <input type="hidden" name="id" value={im.id} />
              <label className="sr-only" htmlFor={`cap-${im.id}`}>Caption</label>
              <input id={`cap-${im.id}`} name="caption" defaultValue={im.caption ?? ""} placeholder="Caption" className={`${inputCls} py-1.5 text-xs`} />
              <div className="flex justify-between text-xs">
                <button name="op" value="save" className="font-semibold text-brand-700 underline">Save</button>
                <button name="op" value="delete" className="text-red-700 underline">Remove</button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
