import Link from "next/link";
import { ArrowRight, CalendarClock, QrCode, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { memberEngagement } from "@/lib/stats";
import { formatDay, formatTime, list } from "@/lib/utils";
import { ClubCard, EventCard, PostCard } from "@/components/cards";
import { ClubIcon } from "@/components/ClubIcon";
import { Badge, ButtonLink, Card, Container, EmptyState, SectionHeading, Stat } from "@/components/ui";

export const metadata = { title: "My Clubs" };

const INTEREST_TO_CLUB: Record<string, string[]> = {
  "Public Speaking": ["toastmasters"], Leadership: ["toastmasters", "coaching"], "Coaching & Mentoring": ["coaching"],
  "Health & Safety": ["health-safety"], "Risk Management": ["health-safety"], "Fitness & Wellbeing": ["fitness"],
  "Community Service": ["rotary"], Sustainability: ["rotary"], Construction: ["health-safety"],
};

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireUser("/dashboard");
  const now = new Date();
  const memberships = await db.clubMembership.findMany({ where: { userId: user.id, status: { in: ["ACTIVE", "PENDING"] } }, include: { club: true }, orderBy: { createdAt: "asc" } });
  const activeIds = memberships.filter((m) => m.status === "ACTIVE").map((m) => m.clubId);

  const interestSlugs = list(user.interests).flatMap((i) => INTEREST_TO_CLUB[i] ?? []);
  const [myRegs, recommended, feed, otherClubs, engagement] = await Promise.all([
    db.eventRegistration.findMany({
      where: { userId: user.id, status: { in: ["REGISTERED", "WAITLISTED"] }, event: { endsAt: { gte: now }, status: "PUBLISHED" } },
      include: { event: { include: { club: true } } },
      orderBy: { event: { startsAt: "asc" } },
    }),
    db.event.findMany({
      where: {
        status: "PUBLISHED", startsAt: { gte: now },
        registrations: { none: { userId: user.id, status: { not: "CANCELLED" } } },
        OR: [{ clubId: { in: activeIds } }, { club: { slug: { in: interestSlugs } } }],
      },
      include: { club: true }, orderBy: { startsAt: "asc" }, take: 4,
    }),
    db.post.findMany({ where: { published: true, OR: [{ clubId: { in: activeIds } }, { clubId: null }] }, include: { club: true }, orderBy: { publishedAt: "desc" }, take: 4 }),
    db.club.findMany({ where: { active: true, id: { notIn: memberships.map((m) => m.clubId) } }, orderBy: { sortOrder: "asc" } }),
    memberEngagement(user.id),
  ]);
  const nextUp = myRegs.find((r) => r.status === "REGISTERED");

  return (
    <>
      <section className="hero-bg text-white">
        <Container className="py-10">
          {sp.denied && <p role="alert" className="mb-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm">You don&apos;t have access to the admin portal.</p>}
          <p className="text-sm text-brand-200">My Clubs</p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">Welcome, {user.name.split(" ")[0]}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {memberships.length === 0 && <span className="text-brand-100">You haven&apos;t joined a club yet.</span>}
            {memberships.map((m) => (
              <Link key={m.id} href={`/clubs/${m.club.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/20 hover:bg-white/20">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: m.club.accent }}><ClubIcon name={m.club.icon} className="h-3.5 w-3.5" /></span>
                {m.club.shortName}
                {m.status === "PENDING" && <Badge tone="gold">pending</Badge>}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-600"><CalendarClock className="h-4 w-4" aria-hidden />Next up</h2>
            {nextUp ? (
              <Card className="flex flex-wrap items-center justify-between gap-4 border-l-4" >
                <div>
                  <Badge tone="gray">{nextUp.event.club.shortName}</Badge>
                  <p className="mt-1 font-display text-2xl font-semibold"><Link href={`/events/${nextUp.eventId}`} className="hover:underline">{nextUp.event.title}</Link></p>
                  <p className="text-sm text-muted">{formatDay(nextUp.event.startsAt)} · {formatTime(nextUp.event.startsAt)}{nextUp.event.locationName && ` · ${nextUp.event.locationName}`}</p>
                </div>
                <ButtonLink href={`/tickets/${nextUp.ticketCode}`}><QrCode className="h-4 w-4" aria-hidden />My ticket</ButtonLink>
              </Card>
            ) : (
              <EmptyState title="Nothing booked yet"><Link href="/events" className="font-semibold text-brand-700 underline">Browse upcoming events</Link></EmptyState>
            )}
            {myRegs.length > 1 && <Link href="/my/events" className="mt-2 inline-block text-sm text-brand-700 underline">All my registrations ({myRegs.length})</Link>}
          </section>

          <section>
            <SectionHeading title="Recommended for you" subtitle="From your clubs and interests" />
            {recommended.length ? <div className="grid gap-3 md:grid-cols-2">{recommended.map((e) => <EventCard key={e.id} event={e} />)}</div> : <EmptyState title="No recommendations right now" />}
          </section>

          <section>
            <SectionHeading title="Latest from my clubs" />
            {feed.length ? <div className="grid gap-4 md:grid-cols-2">{feed.map((p) => <PostCard key={p.id} post={p} horizontal />)}</div> : <EmptyState title="No updates yet" />}
          </section>

          {otherClubs.length > 0 && (
            <section>
              <SectionHeading title="Explore more clubs" />
              <div className="grid gap-5 sm:grid-cols-2">{otherClubs.slice(0, 4).map((c) => <ClubCard key={c.id} club={c} />)}</div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="font-display text-xl font-semibold">My engagement</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat value={engagement.clubsJoined} label="Clubs joined" />
              <Stat value={engagement.attended} label="Activities attended" />
              <Stat value={engagement.volunteer} label="Volunteer activities" />
              <Stat value={engagement.impactHours} label="Impact hours" />
            </div>
            <p className="mt-3 text-xs text-muted">{engagement.registered} registrations · {engagement.partnerEngagements} partner engagements</p>
            <Link href="/profile#history" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Engagement history <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </Card>
          {!user.profileCompleted && (
            <Card className="bg-gold-300/30">
              <p className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" aria-hidden />Complete your profile</p>
              <p className="mt-1 text-sm text-muted">Help Club Captains get to know you.</p>
              <ButtonLink href="/onboarding" size="sm" className="mt-3">Complete profile</ButtonLink>
            </Card>
          )}
        </aside>
      </Container>
    </>
  );
}
