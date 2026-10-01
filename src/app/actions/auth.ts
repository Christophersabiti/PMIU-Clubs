"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { sendMail, esc } from "@/lib/mail";
import { safeNext, str } from "@/lib/utils";
import type { ActionState } from "@/components/forms";

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(100),
  email: z.string().email("Please enter a valid email address").max(200),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export async function register(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({ name: str(fd, "name"), email: str(fd, "email").toLowerCase(), password: str(fd, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (str(fd, "password") !== str(fd, "confirm")) return { error: "Passwords do not match." };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) return { error: "An account with this email already exists. Please sign in." };

  const user = await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await bcrypt.hash(parsed.data.password, 10) },
  });
  await audit(user.id, "user.register", "User", user.id);
  await notifyUser(
    user.id,
    { title: `Welcome to PMI Uganda Clubs, ${user.name.split(" ")[0]}!`, body: "Complete your profile and join the clubs that interest you.", link: "/onboarding", kind: "INFO" },
    { subject: "Welcome to PMI Uganda Clubs", html: `<p>Hi ${esc(user.name)},</p><p>Your account is ready. One account lets you join every PMI Uganda club, register for activities and track your engagement.</p>`, cta: "Complete your profile", template: "welcome" },
  );
  await createSession(user.id);
  redirect(`/onboarding?next=${encodeURIComponent(safeNext(str(fd, "next"), "/dashboard"))}`);
}

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  const ok = user?.passwordHash ? await bcrypt.compare(str(fd, "password"), user.passwordHash) : false;
  if (!user || !ok) return { error: "Incorrect email or password." };
  await createSession(user.id);
  await audit(user.id, "user.login", "User", user.id);
  redirect(user.profileCompleted ? safeNext(str(fd, "next")) : `/onboarding?next=${encodeURIComponent(safeNext(str(fd, "next")))}`);
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(24).toString("base64url");
    await db.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpires: new Date(Date.now() + 3600_000) } });
    await sendMail({
      to: user.email,
      subject: "Reset your PMI Uganda Clubs password",
      heading: "Reset your password",
      body: "<p>Use the button below to choose a new password. The link expires in 1 hour. If you did not request this, you can ignore this email.</p>",
      cta: { label: "Reset password", href: `/reset-password?token=${token}` },
      template: "reset",
    });
  }
  // Same response either way to avoid account enumeration
  return { success: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const token = str(fd, "token");
  const password = str(fd, "password");
  const check = registerSchema.shape.password.safeParse(password);
  if (!check.success) return { error: check.error.issues[0].message };
  const user = await db.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) return { error: "This reset link is invalid or has expired." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10), resetToken: null, resetTokenExpires: null } });
  await audit(user.id, "user.password_reset", "User", user.id);
  await createSession(user.id);
  redirect("/dashboard");
}
