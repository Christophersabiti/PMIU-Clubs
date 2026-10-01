import Image from "next/image";
import Link from "next/link";
import { Bell, Menu, Search, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAdminAccess } from "@/lib/permissions";
import { mediaUrl } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { Avatar, btn } from "./ui";

export const NAV = [
  { href: "/clubs", label: "Clubs" },
  { href: "/activities", label: "Activities" },
  { href: "/events", label: "Events" },
  { href: "/partners", label: "Partners" },
  { href: "/impact", label: "Impact" },
  { href: "/resources", label: "Resources" },
  { href: "/news", label: "News" },
];

export async function Header() {
  const user = await getCurrentUser();
  const unread = user ? await db.notification.count({ where: { userId: user.id, readAt: null } }) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 text-ink backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="PMI Uganda Clubs — home">
          <Image src="/brand/pmi-uganda-logo.png" alt="Project Management Institute Uganda" width={127} height={48} priority className="h-11 w-auto" />
          <span className="hidden border-l border-brand-200 pl-2.5 font-display text-xl font-semibold leading-none text-brand-700 sm:block">Clubs</span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/search" className="rounded-full p-2.5 hover:bg-brand-50" aria-label="Search">
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          {user ? (
            <>
              <Link href="/notifications" className="relative rounded-full p-2.5 hover:bg-brand-50" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <Bell className="h-5 w-5" aria-hidden />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 min-w-4 rounded-full bg-gold-400 px-1 text-center text-[10px] font-bold leading-4 text-brand-950">{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center rounded-full p-1 hover:bg-brand-50" aria-label="Account menu">
                  <Avatar name={user.name} src={mediaUrl(user.photoId)} size={34} />
                </summary>
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-white py-2 text-ink shadow-xl ring-1 ring-brand-100">
                  <div className="border-b border-brand-100 px-4 pb-2">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  {[
                    ["/dashboard", "My Clubs"],
                    ["/my/events", "My Events & Tickets"],
                    ["/profile", "My Profile"],
                    ["/directory", "Member Directory"],
                  ].map(([href, label]) => (
                    <Link key={href} href={href} className="block px-4 py-2 text-sm hover:bg-brand-50">
                      {label}
                    </Link>
                  ))}
                  {hasAdminAccess(user) && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                      <Shield className="h-4 w-4" aria-hidden /> Admin Portal
                    </Link>
                  )}
                  <form action={logout} className="border-t border-brand-100 pt-1">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-brand-50">Sign out</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium hover:bg-brand-50 sm:block">
                Sign in
              </Link>
              <Link href="/register" className={`${btn.base} ${btn.primary} ${btn.sm} whitespace-nowrap`}>
                Join a club
              </Link>
            </>
          )}
          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-full p-2.5 hover:bg-brand-50" aria-label="Open menu">
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <nav aria-label="Mobile" className="absolute right-0 mt-2 w-56 rounded-2xl bg-white py-2 text-ink shadow-xl ring-1 ring-brand-100">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block px-4 py-2.5 text-sm hover:bg-brand-50">
                  {n.label}
                </Link>
              ))}
              {!user && (
                <Link href="/login" className="block border-t border-brand-100 px-4 py-2.5 text-sm font-semibold">
                  Sign in
                </Link>
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
