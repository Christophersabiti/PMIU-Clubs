import { requireAdmin } from "@/lib/permissions";
import { AdminTitle } from "@/components/admin";
import { GalleryForm } from "../GalleryForm";
import { galleryOptions } from "../options";

export const metadata = { title: "New gallery" };

export default async function NewGallery() {
  const user = await requireAdmin();
  return (<><AdminTitle title="New gallery" back={{ href: "/admin/galleries", label: "Galleries" }} /><GalleryForm {...await galleryOptions(user)} /></>);
}
