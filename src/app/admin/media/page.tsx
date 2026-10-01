import { db } from "@/lib/db";
import { clubScope, isChapterAdmin, manageableClubs, requireAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { deleteMedia, uploadMedia } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input, Select, inputCls } from "@/components/ui";

export const metadata = { title: "Media library" };

export default async function MediaLibrary() {
  const user = await requireAdmin();
  const [items, clubs] = await Promise.all([
    db.media.findMany({ where: clubScope(user, "content.manage"), orderBy: { createdAt: "desc" }, take: 120, include: { club: true, uploadedBy: true } }),
    manageableClubs(user, "content.manage"),
  ]);
  return (
    <>
      <AdminTitle title="Media library" subtitle="Images (JPG, PNG, WebP ≤ 4 MB) and PDFs (≤ 4 MB). Files are type-checked by content and stored under generated names. Videos: embed from YouTube." />
      <Card className="mb-6">
        <ActionForm action={uploadMedia} className="grid items-end gap-3 md:grid-cols-4" resetOnSuccess>
          <Field label="File" name="file"><input id="file" name="file" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className={inputCls} /></Field>
          <Input label="Alt text / description" name="alt" />
          <Select label="Club" name="clubId" options={clubs.map((c) => ({ value: c.id, label: c.shortName }))} placeholder={isChapterAdmin(user) ? "Chapter-wide" : undefined} required={!isChapterAdmin(user)} />
          <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
        </ActionForm>
      </Card>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((m) => (
          <li key={m.id} className="overflow-hidden rounded-2xl bg-white text-xs ring-1 ring-brand-100">
            {m.kind === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${m.id}`} alt={m.alt ?? ""} className="aspect-square w-full object-cover" />
            ) : (
              <a href={`/api/media/${m.id}`} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center bg-brand-50 font-semibold text-brand-700">PDF</a>
            )}
            <div className="space-y-1 p-2">
              <p className="truncate font-medium" title={m.originalName}>{m.originalName}</p>
              <p className="text-muted">{Math.round(m.size / 1024)} KB · {m.club?.shortName ?? "Chapter"} · {formatDate(m.createdAt)}</p>
              <input readOnly value={`/api/media/${m.id}`} aria-label="File URL" className="w-full rounded border border-brand-100 px-1 py-0.5 font-mono text-[10px]" />
              <form action={deleteMedia}><input type="hidden" name="id" value={m.id} /><button className="text-red-700 underline">Delete</button></form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
