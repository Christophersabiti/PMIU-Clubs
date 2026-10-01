import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";

/**
 * Upload policy (OWASP file-upload guidance):
 *  - allowlist of types, verified by magic bytes rather than the client's MIME/extension
 *  - size limits per kind (≤ 4 MB: Vercel functions accept request bodies up to 4.5 MB)
 *  - generated storage names; the user's filename is only kept as metadata
 *  - authorization is enforced by the calling action/route
 *
 * Backend: Supabase Storage (private bucket, server-side service-role key) when SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set; otherwise local disk (development only).
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
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

function supabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

export function sniffMime(buf: Buffer): AllowedMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

async function ensureBucket(sb: { url: string; key: string }) {
  const res = await fetch(`${sb.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: 4 * MB, allowed_mime_types: Object.keys(ALLOWED) }),
  });
  // 200 = created; 400/409 = already exists
  if (!res.ok && res.status !== 400 && res.status !== 409) throw new Error(`Storage bucket error: ${res.status}`);
}

export async function saveFile(buf: Buffer, mime: AllowedMime) {
  const storageKey = `${randomBytes(16).toString("hex")}.${ALLOWED[mime].ext}`;
  const sb = supabase();
  if (!sb) {
    await mkdir(LOCAL_ROOT, { recursive: true });
    await writeFile(path.join(LOCAL_ROOT, storageKey), buf);
    return storageKey;
  }
  const upload = () =>
    fetch(`${sb.url}/storage/v1/object/${BUCKET}/${storageKey}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key, "Content-Type": mime, "x-upsert": "false" },
      body: new Uint8Array(buf),
    });
  let res = await upload();
  if (res.status === 404 || res.status === 400) {
    const text = await res.text();
    if (/bucket/i.test(text)) {
      await ensureBucket(sb);
      res = await upload();
    } else throw new Error(`Upload failed: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return storageKey;
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  if (!KEY_RE.test(storageKey)) throw new Error("bad key");
  const sb = supabase();
  if (!sb) return readFile(path.join(LOCAL_ROOT, storageKey));
  const res = await fetch(`${sb.url}/storage/v1/object/authenticated/${BUCKET}/${storageKey}`, {
    headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key },
  });
  if (!res.ok) throw new Error(`not found (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteStoredFile(storageKey: string) {
  if (!KEY_RE.test(storageKey)) return;
  const sb = supabase();
  if (!sb) {
    await unlink(path.join(LOCAL_ROOT, storageKey)).catch(() => {});
    return;
  }
  await fetch(`${sb.url}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [storageKey] }),
  }).catch(() => {});
}
