import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { readSession } from "./session";

export const getCurrentUser = cache(async () => {
  const userId = await readSession();
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { clubRoles: true },
  });
  if (!user) return null;
  // Track monthly-active members (throttled to once per hour)
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 3600_000) {
    await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  }
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}
