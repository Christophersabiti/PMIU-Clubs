import "server-only";
import { db } from "./db";
import { sendMail, esc } from "./mail";

type Notice = { title: string; body?: string; link?: string; kind?: string };

export async function notifyUser(userId: string, n: Notice, email?: { subject: string; html: string; cta?: string; template: string }) {
  await db.notification.create({ data: { userId, title: n.title, body: n.body, link: n.link, kind: n.kind ?? "INFO" } });
  if (email) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailOptIn: true } });
    // Transactional mail (registration, membership) always sends; broadcasts respect opt-in.
    const transactional = ["welcome", "club_joined", "membership_pending", "membership_decision", "registration", "reset"].includes(email.template);
    if (user && (transactional || user.emailOptIn)) {
      await sendMail({
        to: user.email,
        subject: email.subject,
        heading: n.title,
        body: email.html,
        cta: n.link && email.cta ? { label: email.cta, href: n.link } : undefined,
        template: email.template,
      });
    }
  }
}

/** Notify all active members of a club (or the whole platform when clubId is null). */
export async function notifyClub(clubId: string | null, n: Notice, emailTemplate: string, ctaLabel = "View") {
  const users = clubId
    ? (await db.clubMembership.findMany({ where: { clubId, status: "ACTIVE" }, select: { userId: true } })).map((m) => m.userId)
    : (await db.user.findMany({ select: { id: true } })).map((u) => u.id);
  for (const userId of users) {
    await notifyUser(userId, n, { subject: n.title, html: `<p>${esc(n.body ?? "")}</p>`, cta: ctaLabel, template: emailTemplate });
  }
  return users.length;
}
