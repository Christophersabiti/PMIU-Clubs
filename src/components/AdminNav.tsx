"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; badge?: number };

export function AdminNav({ groups }: { groups: { title: string; items: NavItem[] }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-brand-300">{g.title}</p>
          <ul className="mt-1 space-y-0.5">
            {g.items.map((i) => {
              const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
              return (
                <li key={i.href}>
                  <Link href={i.href} aria-current={active ? "page" : undefined}
                    className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm", active ? "bg-white/15 font-semibold text-white" : "text-brand-100 hover:bg-white/10")}>
                    {i.label}
                    {!!i.badge && <span className="rounded-full bg-gold-400 px-1.5 text-[11px] font-bold text-brand-950">{i.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
