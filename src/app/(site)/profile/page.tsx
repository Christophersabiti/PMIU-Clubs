import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { memberEngagement } from "@/lib/stats";
import { formatDate, mediaUrl } from "@/lib/utils";
import { updateProfile } from "@/app/actions/member";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ProfileFields } from "@/components/ProfileFields";
import { Avatar, Badge, Card, Checkbox, Container, Field, inputCls } from "@/components/ui";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [engagement, memberships, attendance] = await Promise.all([
    memberEngagement(user.id),
    db.clubMembership.findMany({ where: { userId: user.id, status: "ACTIVE" }, include: { club: true } }),
    db.eventAttendance.findMany({ where: { userId: user.id }, include: { event: { include: { club: true } } }, orderBy: { checkedInAt: "desc" } }),
  ]);
  return (
    <>
      <section className="hero-bg text-white">
        <Container className="flex flex-wrap items-center gap-5 py-10">
          <Avatar name={user.name} src={mediaUrl(user.photoId)} size={88} />
          <div>
            <h1 className="font-display text-4xl font-semibold">{user.name}</h1>
            <p className="text-brand-100">{[user.certifications, user.jobTitle, user.organization].filter(Boolean).join(" · ")}</p>
            {user.isPmiMember && <Badge tone="gold" className="mt-2">PMI {user.pmiChapter ?? ""} Chapter Member</Badge>}
            <p className="mt-2"><Link href={`/members/${user.id}`} className="text-sm text-gold-300 underline">View my public profile</Link></p>
          </div>
        </Container>
      </section>
      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <Card className="p-7">
          <ActionForm action={updateProfile}>
            <Field label="Profile photo" name="photo" hint="JPG, PNG or WebP, max 4 MB.">
              <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} />
            </Field>
            <div className="mt-8"><ProfileFields user={user} /></div>
            <fieldset className="mt-8">
              <legend className="mb-2 font-display text-xl font-semibold">Privacy & communication</legend>
              <p className="mb-3 text-sm text-muted">You control what other members can see.</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <Checkbox name="showInDirectory" label="Show me in the member directory" defaultChecked={user.showInDirectory} />
                <Checkbox name="showClubs" label="Show my clubs" defaultChecked={user.showClubs} />
                <Checkbox name="showActivity" label="Show my engagement history" defaultChecked={user.showActivity} />
                <Checkbox name="showEmail" label="Show my email to members" defaultChecked={user.showEmail} />
                <Checkbox name="showPhone" label="Show my phone to members" defaultChecked={user.showPhone} />
                <Checkbox name="emailOptIn" label="Email me announcements & reminders" hint="Registration and membership emails are always sent." defaultChecked={user.emailOptIn} />
              </div>
            </fieldset>
            <div className="mt-8"><SubmitButton>Save profile</SubmitButton></div>
          </ActionForm>
        </Card>

        <aside className="space-y-6" id="history">
          <Card>
            <h2 className="font-display text-xl font-semibold">Engagement history</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="font-medium">Joined</dt><dd className="text-muted">{memberships.map((m) => m.club.shortName).join(", ") || "—"}</dd></div>
              <div className="flex justify-between"><dt>Registered</dt><dd className="font-semibold">{engagement.registered} activities</dd></div>
              <div className="flex justify-between"><dt>Attended</dt><dd className="font-semibold">{engagement.attended} activities</dd></div>
              <div className="flex justify-between"><dt>Volunteer</dt><dd className="font-semibold">{engagement.volunteer} activities</dd></div>
              <div className="flex justify-between"><dt>Impact</dt><dd className="font-semibold">{engagement.impactHours} hours</dd></div>
              <div className="flex justify-between"><dt>Partner engagements</dt><dd className="font-semibold">{engagement.partnerEngagements}</dd></div>
            </dl>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">Past activities</h2>
            {attendance.length === 0 && <p className="mt-2 text-sm text-muted">Attended events appear here after check-in.</p>}
            <ul className="mt-3 space-y-2 text-sm">
              {attendance.map((a) => (
                <li key={a.id}><Link href={`/events/${a.eventId}`} className="font-medium hover:underline">{a.event.title}</Link><p className="text-xs text-muted">{a.event.club.shortName} · {formatDate(a.event.startsAt)}</p></li>
              ))}
            </ul>
          </Card>
        </aside>
      </Container>
    </>
  );
}
