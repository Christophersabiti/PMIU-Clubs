import "server-only";
import { db } from "./db";
import { ALLOWED, saveFile, sniffMime } from "./storage";

export class UploadError extends Error {}

/** Validate and persist an uploaded file. Returns the Media row, or null when no file was provided. */
export async function storeUpload(
  value: FormDataEntryValue | null,
  opts: { userId: string; clubId?: string | null; accept?: ("IMAGE" | "DOCUMENT")[]; alt?: string | null },
) {
  if (!value || typeof value === "string" || value.size === 0) return null;
  const file = value as File;
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime) throw new UploadError("Unsupported file type. Use JPG, PNG, WebP or PDF.");
  const rule = ALLOWED[mime];
  if (opts.accept && !opts.accept.includes(rule.kind)) throw new UploadError(`Please upload ${opts.accept.includes("IMAGE") ? "an image (JPG, PNG or WebP)" : "a PDF document"}.`);
  if (buf.length > rule.max) throw new UploadError(`File is too large. Maximum is ${Math.round(rule.max / 1024 / 1024)} MB.`);
  const storageKey = await saveFile(buf, mime);
  return db.media.create({
    data: {
      storageKey,
      originalName: file.name.slice(0, 200),
      mimeType: mime,
      size: buf.length,
      kind: rule.kind,
      alt: opts.alt ?? null,
      clubId: opts.clubId ?? null,
      uploadedById: opts.userId,
    },
  });
}
