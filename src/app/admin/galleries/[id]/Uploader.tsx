"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadGalleryImages } from "@/app/actions/admin";
import { btn, inputCls } from "@/components/ui";

const MAX = 4 * 1024 * 1024;

/** Uploads one photo per request so each stays under the 4.5 MB serverless body limit. */
export function GalleryUploader({ galleryId }: { galleryId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: number; errors: string[]; progress?: string } | null>(null);

  async function start() {
    const files = Array.from(fileRef.current?.files ?? []);
    if (!files.length) return setMsg({ ok: 0, errors: ["Choose at least one image."] });
    setBusy(true);
    let ok = 0;
    const errors: string[] = [];
    for (const [i, f] of files.entries()) {
      setMsg({ ok, errors, progress: `Uploading ${i + 1} of ${files.length}…` });
      if (f.size > MAX) {
        errors.push(`${f.name}: larger than 4 MB`);
        continue;
      }
      const fd = new FormData();
      fd.set("galleryId", galleryId);
      fd.set("caption", caption);
      fd.append("images", f);
      const res = await uploadGalleryImages(undefined, fd);
      if (res?.error) errors.push(`${f.name}: ${res.error}`);
      else ok++;
    }
    setBusy(false);
    setMsg({ ok, errors });
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <label htmlFor="images" className="mb-1.5 block text-sm font-medium">Images</label>
        <input ref={fileRef} id="images" type="file" multiple accept="image/jpeg,image/png,image/webp" className={inputCls} aria-describedby="images-hint" />
        <p id="images-hint" className="mt-1 text-xs text-muted">JPG, PNG or WebP · max 4 MB each · select as many as you like</p>
      </div>
      <div>
        <label htmlFor="caption" className="mb-1.5 block text-sm font-medium">Caption (applied to all)</label>
        <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} />
      </div>
      <button type="button" onClick={start} disabled={busy} className={`${btn.base} ${btn.primary} ${btn.sm}`}>
        {busy ? "Uploading…" : "Upload"}
      </button>
      <div aria-live="polite" className="text-sm">
        {msg?.progress && busy && <p>{msg.progress}</p>}
        {!busy && msg && msg.ok > 0 && <p className="rounded-xl bg-emerald-50 px-3 py-2 font-medium text-emerald-800">{msg.ok} image(s) uploaded.</p>}
        {msg?.errors.map((e) => (
          <p key={e} role="alert" className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-red-800">{e}</p>
        ))}
      </div>
    </div>
  );
}
