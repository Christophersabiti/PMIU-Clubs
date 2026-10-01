import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2 as Linkedin, Mail, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isChapterAdmin } from "@/lib/permissions";
import { memberEngagement } from "@/lib/stats";
import { list, mediaUrl } from "@/lib/utils";
import { Avatar, Badge, Card, Container, Stat } from "@/components/ui";

export const metadata = { title: "Member profile" };

export default async function MemberPage({ params }: PageProps<"/members/[id]">) {
  const { id } = await params;
  const viewer = await requireUser(`/members/${id}`);
  const u = await db.user.findUnique({ where: { id }, include: { memberships: { where: { status: "ACTIVE" }, include: { club: true } } } });
  const self = viewer.id === id;
  const privileged = self || isChapterAdmin(viewer);
  if (!u || (!u.showInDirectory && !privileged)) notFound();
  const engagement = u.showActivity || privileged ? await memberEngagement(u.id) : null;
  return (
    <Container className="max-w-4xl py-10">
      <Card className="p-7">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={u.name} src={mediaUrl(u.photoId)} size={96} />
          <div>
            <h1 className="font-display text-4xl font-semibold">{u.name}</h1>
            {u.certifications && <p className="font-semibold text-brand-700">{u.certifications}</p>}
            <p className="text-muted">{[u.jobTitle, u.organization].filter(Boolean).join(" · ")}</p>
            {u.isPmiMember && <Badge tone="gold" className="mt-2">PMI {u.pmiChapter} Chapter Member</Badge>}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          {(u.showEmail || privileged) && <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1.5 text-brand-700 underline"><Mail className="h-4 w-4" aria-hidden />{u.email}</a>}
          {u.phone && (u.showPhone || privileged) && <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1.5 text-brand-700 underline"><Phone className="h-4 w-4" aria-hidden />{u.phone}</a>}
          {u.linkedin && <a href={u.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand-700 underline"><Linkedin className="h-4 w-4" aria-hidden />LinkedIn</a>}
        </div>
        {u.bio && <p className="mt-5 text-[15px] leading-relaxed">{u.bio}</p>}
        {(u.showClubs || privileged) && u.memberships.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Clubs</h2>
            <ul className="mt-2 flex flex-wrap gap-2">{u.memberships.map((m) => <li key={m.id}><Link href={`/clubs/${m.club.slug}`}><Badge tone="brand" className="text-sm">✓ {m.club.shortName}</Badge></Link></li>)}</ul>
          </div>
        )}
        {list(u.interests).length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Interests</h2>
            <ul className="mt-2 flex flex-wrap gap-2">{list(u.interests).map((i) => <li key={i}><Badge tone="gray">{i}</Badge></li>)}</ul>
          </div>
        )}
        {engagement && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={engagement.clubsJoined} label="Clubs" />
            <Stat value={engagement.attended} label="Activities attended" />
            <Stat value={engagement.volunteer} label="Volunteer activities" />
            <Stat value={engagement.impactHours} label="Impact hours" />
          </div>
        )}
        {self && <p className="mt-6 text-sm"><Link href="/profile" className="text-brand-700 underline">Edit profile & privacy</Link></p>}
      </Card>
    </Container>
  );
}
