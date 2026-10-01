import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { appUrl, safeNext } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const state = jar.get("g_state")?.value;
  const next = safeNext(jar.get("g_next")?.value);
  jar.delete("g_state");
  jar.delete("g_next");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== url.searchParams.get("state")) return NextResponse.redirect(appUrl("/login?error=google_failed"));

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: appUrl("/api/auth/google/callback"),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(appUrl("/login?error=google_failed"));
  const { access_token } = (await tokenRes.json()) as { access_token: string };
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) return NextResponse.redirect(appUrl("/login?error=google_failed"));
  const info = (await infoRes.json()) as { sub: string; email: string; email_verified: boolean; name?: string };
  if (!info.email_verified) return NextResponse.redirect(appUrl("/login?error=google_unverified"));

  const email = info.email.toLowerCase();
  let user = await db.user.findFirst({ where: { OR: [{ googleId: info.sub }, { email }] } });
  if (!user) {
    user = await db.user.create({ data: { email, name: info.name ?? email.split("@")[0], googleId: info.sub } });
    await audit(user.id, "user.register_google", "User", user.id);
  } else if (!user.googleId) {
    user = await db.user.update({ where: { id: user.id }, data: { googleId: info.sub } });
  }
  await createSession(user.id);
  return NextResponse.redirect(appUrl(user.profileCompleted ? next : `/onboarding?next=${encodeURIComponent(next)}`));
}
