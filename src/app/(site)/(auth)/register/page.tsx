import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { RegisterForm } from "@/components/AuthForms";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Join PMI Uganda Clubs</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Open to PMI members, partner representatives and invited community participants. Your PMI membership number is added to your profile — it is not your login.</p>
      <GoogleButton next={next} />
      <RegisterForm next={next} />
      <p className="mt-6 text-sm">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 underline">Sign in</Link></p>
    </>
  );
}
