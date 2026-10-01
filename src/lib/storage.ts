import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import { del, get, put } from "@vercel/blob";

/**
 * Upload policy (OWASP file-upload guidance):
 *  - allowlist of types, verified by magic bytes rather than the client's MIME/extension
 *  - size limits per kind (≤ 4 MB: Vercel functions accept request bodies up to 4.5 MB)
 *  - generated storage names; the user's filename is only kept as metadata
 *  - authorization is enforced by the calling action/route
 *
 * Backend: Vercel Blob (private store) when BLOB_READ_WRITE_TOKEN is set; otherwise local disk (development only).
 * Files are always served through /api/media/:id so access and headers stay under app control.
 */
const MB = 1024 * 1024;
export const ALLOWED = {
  "image/jpeg": { ext: "jpg", kind: "IMAGE", max: 4 * MB },
  "image/png": { ext: "png", kind: "IMAGE", max: 4 * MB },
  "image/webp": { ext: "webp", kind: "IMAGE", max: 4 * MB },
  "application/pdf": { ext: "pdf", kind: "DOCUMENT", max: 4 * MB },
} as const;
export type AllowedMime = keyof typeof ALLOWED;

const KEY_RE = /^[a-f0-9]{32}\.(jpg|png|webp|pdf)$/;
const LOCAL_ROOT = path.join(process.cwd(), "storage", "uploads");
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const blobPath = (key: string) => `media/${key}`;

export function sniffMime(buf: Buffer): AllowedMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

export async function saveFile(buf: Buffer, mime: AllowedMime) {
  const storageKey = `${randomBytes(16).toString("hex")}.${ALLOWED[mime].ext}`;
  if (blobEnabled()) {
    await put(blobPath(storageKey), buf, { access: "private", contentType: mime, addRandomSuffix: false });
  } else {
    await mkdir(LOCAL_ROOT, { recursive: true });
    await writeFile(path.join(LOCAL_ROOT, storageKey), buf);
  }
  return storageKey;
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  if (!KEY_RE.test(storageKey)) throw new Error("bad key");
  if (!blobEnabled()) return readFile(path.join(LOCAL_ROOT, storageKey));
  const res = await get(blobPath(storageKey), { access: "private" });
  if (!res || res.statusCode !== 200) throw new Error("not found");
  return Buffer.from(await new Response(res.stream).arrayBuffer());
}

export async function deleteStoredFile(storageKey: string) {
  if (!KEY_RE.test(storageKey)) return;
  if (blobEnabled()) await del(blobPath(storageKey)).catch(() => {});
  else await unlink(path.join(LOCAL_ROOT, storageKey)).catch(() => {});
}
