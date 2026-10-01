import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl, safeNext } from "@/lib/utils";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(appUrl("/login?error=google_unavailable"));
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("g_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  jar.set("g_next", next, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: appUrl("/api/auth/google/callback"),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
