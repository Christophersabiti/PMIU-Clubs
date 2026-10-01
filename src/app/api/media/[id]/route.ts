import { db } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/media/[id]">) {
  const { id } = await ctx.params;
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const buf = await readStoredFile(m.storageKey);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": m.mimeType,
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // PDFs open inline; filename is sanitised
        "Content-Disposition": `inline; filename="${m.originalName.replace(/[^\w.\- ]/g, "_")}"`,
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
