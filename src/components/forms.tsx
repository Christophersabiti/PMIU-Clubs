"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { btn } from "./ui";

export type ActionState = { error?: string; success?: string; ts?: number } | undefined;
export type FormAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function SubmitButton({ children, variant = "primary", className, pendingText, size }: { children: React.ReactNode; variant?: keyof typeof btn; className?: string; pendingText?: string; size?: "sm" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={cn(btn.base, btn[variant], size === "sm" && btn.sm, className)}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

/** Form wired to a server action that returns {error|success}; messages are announced to screen readers. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  confirm,
}: {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <div aria-live="polite" className="empty:hidden">
        {state?.error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800">
            {state.error}
          </p>
        )}
        {state?.success && <p className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800">{state.success}</p>}
      </div>
    </form>
  );
}
