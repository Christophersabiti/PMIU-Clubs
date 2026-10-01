import Link from "next/link";
import { db } from "@/lib/db";
import { clubImpact, impactSummary, targetProgress } from "@/lib/stats";
import { ClubIcon } from "@/components/ClubIcon";
import { PostCard } from "@/components/cards";
import { Card, Container, PageHeader, Progress, SectionHeading, Stat } from "@/components/ui";

export const metadata = { title: "Community Impact" };
export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const [summary, clubs, stories] = await Promise.all([
    impactSummary(),
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.post.findMany({ where: { type: "IMPACT_STORY", published: true }, orderBy: { publishedAt: "desc" }, take: 6, include: { club: true } }),
  ]);
  const rows = await Promise.all(clubs.map(async (c) => ({ club: c, impact: await clubImpact(c.id), progress: await targetProgress(c) })));

  return (
    <>
      <PageHeader eyebrow="Community impact" title="Impact Dashboard" intro="Vision + PMI Uganda Members + Partner Expertise + Practical Activities = Community Impact. Live figures from club participation and recorded outcomes.">
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Stat tone="dark" value={summary.participants} label="Club participants" />
          <Stat tone="dark" value={summary.activities} label="Activities" />
          <Stat tone="dark" value={summary.communityProjects} label="Community projects" />
          <Stat tone="dark" value={summary.volunteerHours} label="Volunteer hours" />
          <Stat tone="dark" value={summary.partners} label="Strategic partners" />
          <Stat tone="dark" value={summary.peopleImpacted} label="People impacted" />
        </div>
      </PageHeader>

      <Container className="py-12">
        <SectionHeading title="Success by 31 December 2026" subtitle="Pilot targets from the Club Partnership Initiative, tracked live." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ club, impact, progress }) => (
            <Card key={club.id}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: club.accent }}><ClubIcon name={club.icon} className="h-5 w-5" /></span>
                <h2 className="font-display text-xl font-semibold"><Link href={`/clubs/${club.slug}`} className="hover:underline">{club.shortName}</Link></h2>
              </div>
              {club.targetLabel && (
                <div className="mt-4">
                  <p className="text-sm"><span className="font-display text-3xl font-semibold text-brand-700">{club.targetValue}</span> <span className="text-muted">{club.targetLabel}</span></p>
                  {progress && (
                    <div className="mt-2">
                      <Progress pct={progress.pct} color={club.accent} label={`${club.shortName} progress to target`} />
                      <p className="mt-1 text-xs text-muted">{progress.current} achieved · {progress.pct}%</p>
                    </div>
                  )}
                </div>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-brand-50 p-2.5"><dt className="text-xs text-muted">Members</dt><dd className="text-lg font-semibold">{impact.members}</dd></div>
                <div className="rounded-xl bg-brand-50 p-2.5"><dt className="text-xs text-muted">Activities delivered</dt><dd className="text-lg font-semibold">{impact.activitiesDelivered}</dd></div>
                <div className="rounded-xl bg-brand-50 p-2.5"><dt className="text-xs text-muted">Participants checked in</dt><dd className="text-lg font-semibold">{impact.attendance}</dd></div>
                <div className="rounded-xl bg-brand-50 p-2.5"><dt className="text-xs text-muted">Volunteer hours</dt><dd className="text-lg font-semibold">{impact.volunteerHours}</dd></div>
                {impact.metrics.map((m) => (
                  <div key={m.metric} className="rounded-xl bg-gold-300/30 p-2.5"><dt className="text-xs text-muted">{m.label}</dt><dd className="text-lg font-semibold">{m.value}</dd></div>
                ))}
              </dl>
            </Card>
          ))}
        </div>

        <div className="mt-14">
          <SectionHeading title="Impact stories" subtitle="Problem · People · Results · Lessons" />
          {stories.length === 0 ? (
            <p className="rounded-2xl bg-brand-50 p-6 text-sm text-muted">Impact stories will be documented as clubs deliver their first activities in November and showcased in December.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">{stories.map((p) => <PostCard key={p.id} post={p} />)}</div>
          )}
        </div>
      </Container>
    </>
  );
}
