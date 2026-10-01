import Link from "next/link";
import { ForgotForm } from "@/components/AuthForms";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
      <ForgotForm />
      <p className="mt-6 text-sm"><Link href="/login" className="text-brand-700 underline">Back to sign in</Link></p>
    </>
  );
}
