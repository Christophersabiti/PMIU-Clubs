import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime, cn } from "@/lib/utils";
import { markAllRead } from "@/app/actions/member";
import { Badge, Container, EmptyState, PageHeader, btn } from "@/components/ui";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <>
      <PageHeader title="Notifications" intro={unread ? `${unread} unread` : "You're all caught up."}>
        {unread > 0 && <form action={markAllRead} className="mt-5"><button className={`${btn.base} ${btn.light} ${btn.sm}`}>Mark all as read</button></form>}
      </PageHeader>
      <Container className="max-w-3xl py-10">
        {items.length === 0 ? <EmptyState title="No notifications yet" /> : (
          <ul className="divide-y divide-brand-100 overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
            {items.map((n) => (
              <li key={n.id} className={cn("relative p-4", !n.readAt && "bg-brand-50")}>
                <div className="flex items-start gap-3">
                  {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                  <div className="flex-1">
                    <Badge tone="gray">{n.kind.toLowerCase()}</Badge>
                    <p className="mt-1 font-semibold">{n.link ? <Link href={n.link} className="after:absolute after:inset-0 hover:underline">{n.title}</Link> : n.title}</p>
                    {n.body && <p className="text-sm text-muted">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
