import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { db } from "@/lib/db";
import { can, clubScope, isChapterAdmin, requireAdmin, ROLE_LABELS } from "@/lib/permissions";
import { AdminNav, type NavItem } from "@/components/AdminNav";

export const metadata = { title: { default: "Admin Portal", template: "%s · Admin · PMI Uganda Clubs" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const chapter = isChapterAdmin(user);
  const clubIds = user.clubRoles.map((r) => r.clubId);
  const has = (cap: Parameters<typeof can>[1]) => chapter || clubIds.some((c) => can(user, cap, c));
  const pending = await db.clubMembership.count({ where: { status: "PENDING", ...clubScope(user, "members.manage") } });

  const groups: { title: string; items: NavItem[] }[] = [
    { title: "Overview", items: [{ href: "/admin", label: "Dashboard" }, { href: "/admin/reports", label: "Reports" }] },
    {
      title: "Community",
      items: [
        { href: "/admin/clubs", label: "Clubs" },
        ...(has("members.manage") ? [{ href: "/admin/members", label: "Members" }, { href: "/admin/applications", label: "Applications", badge: pending }] : []),
        ...(chapter ? [{ href: "/admin/partners", label: "Partners" }] : []),
      ],
    },
    {
      title: "Programme",
      items: [
        ...(has("content.manage") ? [{ href: "/admin/initiatives", label: "Initiatives" }, { href: "/admin/activities", label: "Activities" }] : []),
        ...(has("events.manage") ? [{ href: "/admin/events", label: "Events" }] : []),
        ...(has("attendance.manage") ? [{ href: "/admin/checkin", label: "QR Check-in" }] : []),
      ],
    },
    {
      title: "Content",
      items: [
        ...(has("partnerContent.manage") ? [{ href: "/admin/posts", label: "News & Announcements" }, { href: "/admin/resources", label: "Resources" }] : []),
        ...(has("content.manage") ? [{ href: "/admin/galleries", label: "Galleries" }, { href: "/admin/media", label: "Media library" }] : []),
      ],
    },
    {
      title: "Outcomes",
      items: [
        ...(has("club.edit") ? [{ href: "/admin/impact", label: "Impact" }] : []),
        ...(has("communications.send") ? [{ href: "/admin/communications", label: "Communications" }] : []),
        ...(chapter ? [{ href: "/admin/audit", label: "Audit log" }, { href: "/admin/settings", label: "Settings" }] : []),
      ],
    },
  ].filter((g) => g.items.length);

  const roleLabel = chapter ? ROLE_LABELS[user.globalRole] : [...new Set(user.clubRoles.map((r) => ROLE_LABELS[r.role]))].join(", ");

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/admin" className="block rounded-xl bg-white px-3 py-2.5">
        <Image src="/brand/pmi-uganda-logo.png" alt="Project Management Institute Uganda" width={127} height={48} className="h-10 w-auto" />
        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-widest text-brand-700">Clubs · Admin Portal</span>
      </Link>
      <AdminNav groups={groups} />
      <div className="mt-auto rounded-xl bg-white/5 p-3 text-xs text-brand-200">
        <p className="font-semibold text-white">{user.name}</p>
        <p>{roleLabel}</p>
        <Link href="/" className="mt-2 inline-block text-gold-300 underline">← Back to site</Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-brand-50/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto bg-brand-950 lg:block">{sidebar}</aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between bg-brand-950 px-4 py-3 text-white lg:hidden">
          <span className="font-display text-lg text-gold-400">PMI Uganda Clubs · Admin</span>
          <details className="relative">
            <summary className="list-none rounded-lg p-2 hover:bg-white/10" aria-label="Admin menu"><Menu className="h-5 w-5" aria-hidden /></summary>
            <div className="absolute right-0 z-50 mt-2 max-h-[80vh] w-64 overflow-y-auto rounded-2xl bg-brand-950 shadow-xl ring-1 ring-white/10">{sidebar}</div>
          </details>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
