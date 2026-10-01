"use client";

import Link from "next/link";
import { login, register, requestPasswordReset, resetPassword } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "./forms";
import { Input } from "./ui";

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={login} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required />
      <div className="flex items-center justify-between">
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
        <Link href="/forgot-password" className="text-sm text-brand-700 underline">Forgot password?</Link>
      </div>
    </ActionForm>
  );
}

export function RegisterForm({ next }: { next: string }) {
  return (
    <ActionForm action={register} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Input label="Full name" name="name" autoComplete="name" required />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters, including a letter and a number." />
      <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" required />
      <SubmitButton pendingText="Creating account…" className="w-full">Create account</SubmitButton>
    </ActionForm>
  );
}

export function ForgotForm() {
  return (
    <ActionForm action={requestPasswordReset} className="space-y-4">
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </ActionForm>
  );
}

export function ResetForm({ token }: { token: string }) {
  return (
    <ActionForm action={resetPassword} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Input label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters, including a letter and a number." />
      <SubmitButton pendingText="Saving…">Set new password</SubmitButton>
    </ActionForm>
  );
}
