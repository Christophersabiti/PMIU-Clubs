import Link from "next/link";
import { cn, initials } from "@/lib/utils";

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition min-h-11 px-5 text-sm disabled:opacity-60 disabled:cursor-not-allowed",
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  gold: "bg-gold-400 text-brand-950 hover:bg-gold-300",
  outline: "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  light: "border border-white/30 text-white hover:bg-white/10",
  danger: "bg-red-600 text-white hover:bg-red-700",
  sm: "min-h-9 px-3.5 text-xs",
};

export function ButtonLink({ href, variant = "primary", className, children, size }: { href: string; variant?: keyof typeof btn; className?: string; children: React.ReactNode; size?: "sm" }) {
  return (
    <Link href={href} className={cn(btn.base, btn[variant], size === "sm" && btn.sm, className)}>
      {children}
    </Link>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section className="hero-bg text-white">
      <Container className="py-12 sm:py-16">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-brand-100">{intro}</p>}
        {children}
      </Container>
    </section>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-brand-100 bg-white p-5 shadow-[0_1px_2px_rgba(47,15,102,0.06)]", className)}>{children}</div>;
}

const badgeTones: Record<string, string> = {
  brand: "bg-brand-100 text-brand-800",
  gold: "bg-gold-300/60 text-brand-950",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-sky-100 text-sky-800",
};
export function Badge({ tone = "brand", children, className }: { tone?: keyof typeof badgeTones; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone], className)}>{children}</span>;
}

export function Stat({ value, label, hint, tone = "light" }: { value: React.ReactNode; label: string; hint?: string; tone?: "light" | "dark" }) {
  return (
    <div className={cn("rounded-2xl p-5", tone === "dark" ? "bg-white/5 ring-1 ring-white/15 text-white" : "bg-white ring-1 ring-brand-100")}>
      <div className={cn("font-display text-4xl font-semibold", tone === "dark" ? "text-gold-400" : "text-brand-700")}>{value}</div>
      <div className={cn("mt-1 text-sm font-medium", tone === "dark" ? "text-brand-100" : "text-ink")}>{label}</div>
      {hint && <div className={cn("mt-0.5 text-xs", tone === "dark" ? "text-brand-200" : "text-muted")}>{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-8 text-center">
      <p className="font-semibold text-brand-900">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />;
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full bg-brand-200 font-semibold text-brand-900 ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function Progress({ pct, color = "#7432e0", label }: { pct: number; color?: string; label: string }) {
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ── form primitives (server-safe) ── */
export const inputCls =
  "block w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function Field({ label, name, hint, required, children }: { label: string; name: string; hint?: string; required?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      {children}
      {hint && <p id={`${name}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string };
export function Input({ label, name, hint, className, ...rest }: InputProps) {
  return (
    <Field label={label} name={name} hint={hint} required={rest.required}>
      <input id={name} name={name} aria-describedby={hint ? `${name}-hint` : undefined} className={cn(inputCls, className)} {...rest} />
    </Field>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; hint?: string };
export function Textarea({ label, name, hint, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <Field label={label} name={name} hint={hint} required={rest.required}>
      <textarea id={name} name={name} rows={rows} aria-describedby={hint ? `${name}-hint` : undefined} className={cn(inputCls, className)} {...rest} />
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; hint?: string; options: { value: string; label: string }[]; placeholder?: string };
export function Select({ label, name, hint, options, placeholder, className, ...rest }: SelectProps) {
  return (
    <Field label={label} name={name} hint={hint} required={rest.required}>
      <select id={name} name={name} className={cn(inputCls, className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl p-1">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-5 w-5 rounded border-brand-300 accent-brand-600" />
      <span className="text-sm">
        <span className="font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
