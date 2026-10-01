import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { LoginForm } from "@/components/AuthForms";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in is not configured yet.",
  google_failed: "Google sign-in failed. Please try again.",
  google_unverified: "Your Google email address is not verified.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Sign in to your PMI Uganda Clubs account.</p>
      {sp.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{ERRORS[sp.error] ?? "Sign-in failed."}</p>}
      <GoogleButton next={next} />
      <LoginForm next={next} />
      <p className="mt-6 text-sm">New here? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 underline">Create an account</Link></p>
    </>
  );
}
