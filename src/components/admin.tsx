import Link from "next/link";
import { cn } from "@/lib/utils";
import { btn } from "./ui";

export function AdminTitle({ title, subtitle, action, back }: { title: string; subtitle?: string; action?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back && <Link href={back.href} className="text-sm text-brand-700 hover:underline">← {back.label}</Link>}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand-950">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function NewButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className={cn(btn.base, btn.primary)}>+ {children}</Link>;
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-brand-100">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wider text-muted">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-brand-100">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-center text-sm text-muted">Nothing here yet.</p>}
    </div>
  );
}

export const td = "px-4 py-3 align-top";

export function Created({ show, label = "Created" }: { show?: boolean; label?: string }) {
  if (!show) return null;
  return <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">{label} successfully.</p>;
}
