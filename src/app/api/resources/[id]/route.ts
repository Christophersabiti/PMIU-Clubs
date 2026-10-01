import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/utils";

/** Counts downloads/clicks (a supporting KPI) then redirects to the resource. */
export async function GET(_req: Request, ctx: RouteContext<"/api/resources/[id]">) {
  const { id } = await ctx.params;
  const r = await db.resource.findUnique({ where: { id } });
  if (!r || !r.published) return new NextResponse("Not found", { status: 404 });
  if (r.membersOnly && !(await getCurrentUser())) return NextResponse.redirect(appUrl(`/login?next=/resources`));
  await db.resource.update({ where: { id }, data: { downloads: { increment: 1 } } });
  const target = r.mediaId ? `/api/media/${r.mediaId}` : r.url;
  if (!target) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(target.startsWith("/") ? appUrl(target) : target);
}
