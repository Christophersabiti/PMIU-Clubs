import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, MessageCircle, Target } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { clubImpact, targetProgress } from "@/lib/stats";
import { formatDate, lines, mediaUrl } from "@/lib/utils";
import { leaveClub } from "@/app/actions/member";
import { ActivityCard, EventCard, PostCard, ResourceItem } from "@/components/cards";
import { ClubIcon } from "@/components/ClubIcon";
import { Avatar, Badge, ButtonLink, Card, Container, EmptyState, Progress, SectionHeading, Stat, btn } from "@/components/ui";
import { JoinButton } from "../JoinButton";

export async function generateMetadata({ params }: PageProps<"/clubs/[slug]">) {
  const { slug } = await params;
  const club = await db.club.findUnique({ where: { slug } });
  return { title: club?.name ?? "Club", description: club?.summary ?? undefined };
}

export default async function ClubPage({ params, searchParams }: PageProps<"/clubs/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const club = await db.club.findUnique({
    where: { slug },
    include: {
      partners: { include: { partner: true } },
      roles: { include: { user: true } },
      initiatives: { orderBy: { startDate: "asc" }, include: { activities: { include: { club: true, initiative: true }, orderBy: { startDate: "asc" } } } },
    },
  });
  if (!club || !club.active) notFound();

  const user = await getCurrentUser();
  const now = new Date();
  const [membership, events, posts, galleries, resources, members, memberCount, impact, progress] = await Promise.all([
    user ? db.clubMembership.findUnique({ where: { userId_clubId: { userId: user.id, clubId: club.id } } }) : null,
    db.event.findMany({ where: { clubId: club.id, status: "PUBLISHED", endsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 6, include: { club: true } }),
    db.post.findMany({ where: { clubId: club.id, published: true }, orderBy: { publishedAt: "desc" }, take: 3, include: { club: true } }),
    db.gallery.findMany({ where: { clubId: club.id, published: true }, orderBy: { createdAt: "desc" }, take: 3, include: { images: { take: 4, orderBy: { sortOrder: "asc" } }, _count: { select: { images: true } } } }),
    db.resource.findMany({ where: { clubId: club.id, published: true }, orderBy: { createdAt: "desc" }, take: 6, include: { club: true, partner: true } }),
    db.clubMembership.findMany({ where: { clubId: club.id, status: "ACTIVE", user: { showInDirectory: true } }, take: 12, include: { user: true }, orderBy: { joinedAt: "desc" } }),
    db.clubMembership.count({ where: { clubId: club.id, status: "ACTIVE" } }),
    clubImpact(club.id),
    targetProgress(club),
  ]);
  const regs = user ? new Set((await db.eventRegistration.findMany({ where: { userId: user.id, status: { not: "CANCELLED" } } })).map((r) => r.eventId)) : new Set<string>();
  const leaders = club.roles.filter((r) => r.role === "CLUB_LEAD" || r.role === "CONTENT_MANAGER" || r.role === "EVENT_COORDINATOR");
  const status = membership?.status;

  const joinCta =
    status === "ACTIVE" ? (
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold" className="px-3 py-1.5 text-sm">✓ You&apos;re a member</Badge>
        {club.whatsappUrl && (
          <a href={club.whatsappUrl} target="_blank" rel="noreferrer" className={`${btn.base} ${btn.light} ${btn.sm}`}>
            <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp community
          </a>
        )}
      </div>
    ) : status === "PENDING" ? (
      <Badge tone="gold" className="px-3 py-1.5 text-sm">Request awaiting approval</Badge>
    ) : user ? (
      club.requiresApproval ? (
        <ButtonLink href={`/clubs/${club.slug}/join`} variant="gold">Request to join</ButtonLink>
      ) : (
        <JoinButton clubId={club.id} />
      )
    ) : (
      <ButtonLink href={`/register?next=${encodeURIComponent(`/clubs/${club.slug}/join`)}`} variant="gold">Join Club</ButtonLink>
    );

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 text-white">
        {club.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={club.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-900/40" />
        <Container className="relative py-14 sm:py-20">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: club.accent }}>
              <ClubIcon name={club.icon} className="h-6 w-6" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{club.focus}</p>
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold sm:text-6xl">{club.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-brand-100">{club.description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {joinCta}
            <span className="text-sm text-brand-200">{memberCount} members</span>
          </div>
          {sp.joined === "1" && <p role="status" className="mt-4 inline-block rounded-xl bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100">Welcome to the club! 🎉</p>}
          {sp.joined === "pending" && <p role="status" className="mt-4 inline-block rounded-xl bg-gold-400/20 px-4 py-2 text-sm text-gold-300">Request sent — a club administrator will review it.</p>}
          {user && can(user, "club.edit", club.id) && (
            <p className="mt-4"><Link href={`/admin/clubs/${club.id}`} className="text-sm text-gold-300 underline">Manage this club</Link></p>
          )}
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-14">
          {/* About + vision + gains */}
          <section aria-labelledby="about">
            <SectionHeading title="About the club" />
            <h2 id="about" className="sr-only">About</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Vision</p>
                <p className="mt-2 font-display text-xl text-brand-950">{club.vision}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">What you&apos;ll gain</p>
                <ul className="mt-2 space-y-1.5">
                  {lines(club.gains).map((g) => (
                    <li key={g} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{g}</li>
                  ))}
                </ul>
              </Card>
            </div>
            {club.programme && (
              <Card className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">What the club will do</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {lines(club.programme).map((g) => (
                    <li key={g} className="rounded-xl bg-brand-50 px-3 py-2 text-sm">{g}</li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

          {/* Initiatives + activities */}
          <section>
            <SectionHeading title="Initiatives & activities" subtitle="Club → Initiative → Activities → Events" />
            {club.initiatives.length === 0 && <EmptyState title="No initiatives yet" />}
            <div className="space-y-6">
              {club.initiatives.map((i) => (
                <div key={i.id}>
                  <h3 className="font-display text-xl font-semibold text-brand-900">{i.title}</h3>
                  {i.description && <p className="text-sm text-muted">{i.description}</p>}
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {i.activities.map((a) => (
                      <ActivityCard key={a.id} activity={a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Upcoming events" action={<ButtonLink href={`/events?club=${club.slug}`} variant="outline" size="sm">All club events</ButtonLink>} />
            {events.length === 0 ? <EmptyState title="No upcoming events yet">Check back soon.</EmptyState> : (
              <div className="grid gap-4">{events.map((e) => <EventCard key={e.id} event={e} registered={regs.has(e.id)} />)}</div>
            )}
          </section>

          <section>
            <SectionHeading title="Latest updates" />
            {posts.length === 0 ? <EmptyState title="No updates yet" /> : (
              <div className="grid gap-4 md:grid-cols-3">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
            )}
          </section>

          <section>
            <SectionHeading title="Photo gallery" />
            {galleries.length === 0 ? <EmptyState title="No photos yet">Photos from club activities will appear here.</EmptyState> : (
              <div className="grid gap-4 sm:grid-cols-3">
                {galleries.map((g) => (
                  <Link key={g.id} href={`/gallery/${g.id}`} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
                    <div className="grid grid-cols-2 gap-0.5">
                      {g.images.slice(0, 4).map((im) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={im.id} src={mediaUrl(im.mediaId)!} alt={im.caption ?? ""} className="aspect-square w-full object-cover" />
                      ))}
                    </div>
                    <div className="p-3"><p className="font-semibold">{g.title}</p><p className="text-xs text-muted">{g._count.images} photos</p></div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading title="Resources" action={<ButtonLink href={`/resources?club=${club.slug}`} variant="outline" size="sm">Resource library</ButtonLink>} />
            {resources.length === 0 ? <EmptyState title="No resources yet" /> : <ul className="grid gap-3">{resources.map((r) => <ResourceItem key={r.id} resource={r} />)}</ul>}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {club.targetLabel && (
            <Card className="bg-brand-950 text-white ring-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold-400"><Target className="h-4 w-4" aria-hidden />Target · {club.targetDeadline ? formatDate(club.targetDeadline) : ""}</p>
              <p className="mt-2 font-display text-5xl font-semibold text-gold-400">{club.targetValue}</p>
              <p className="text-sm text-brand-100">{club.targetLabel}</p>
              {progress && (
                <div className="mt-4">
                  <Progress pct={progress.pct} color={club.accent} label="Progress to target" />
                  <p className="mt-1.5 text-xs text-brand-200">{progress.current} of {progress.target} so far ({progress.pct}%)</p>
                </div>
              )}
            </Card>
          )}

          <Card>
            <h2 className="font-display text-xl font-semibold">Community impact</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat value={impact.members} label="Members" />
              <Stat value={impact.activitiesDelivered} label="Activities delivered" />
              <Stat value={impact.attendance} label="Check-ins" />
              <Stat value={impact.volunteerHours} label="Volunteer hours" />
              {impact.metrics.map((m) => <Stat key={m.metric} value={m.value} label={m.label} />)}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold">Partner organisation</h2>
            {club.partners.length === 0 && <p className="mt-2 text-sm text-muted">Partner to be confirmed.</p>}
            {club.partners.map(({ partner, provides, memberBenefit, relationship }) => (
              <div key={partner.id} className="mt-3">
                <Link href={`/partners/${partner.slug}`} className="font-semibold text-brand-800 hover:underline">{partner.name}</Link>
                {partner.status === "PROSPECT" && <Badge tone="gray" className="ml-2">To be confirmed</Badge>}
                <p className="text-xs text-brand-600">{relationship}</p>
                {provides && <p className="mt-1 text-sm"><span className="font-medium">Provides:</span> {provides}</p>}
                {memberBenefit && <p className="text-sm"><span className="font-medium">Member benefit:</span> {memberBenefit}</p>}
                {partner.website && (
                  <a href={partner.website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-brand-700 underline">
                    Visit partner <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                )}
              </div>
            ))}
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold">Club leadership</h2>
            {leaders.length === 0 && <p className="mt-2 text-sm text-muted">Club Captain to be confirmed.</p>}
            <ul className="mt-3 space-y-3">
              {leaders.map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <Avatar name={r.user.name} src={mediaUrl(r.user.photoId)} />
                  <div><p className="text-sm font-semibold">{r.user.name}</p><p className="text-xs text-muted">{r.title ?? r.role}</p></div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold">Members</h2>
            <p className="text-sm text-muted">{memberCount} active members</p>
            <div className="mt-3 flex flex-wrap -space-x-2">
              {members.map((m) => (
                <Link key={m.id} href={`/members/${m.userId}`} title={m.user.name}><Avatar name={m.user.name} src={mediaUrl(m.user.photoId)} size={36} /></Link>
              ))}
            </div>
            {status === "ACTIVE" && (
              <form action={leaveClub} className="mt-4">
                <input type="hidden" name="clubId" value={club.id} />
                <button className="text-xs text-muted underline hover:text-red-700">Leave this club</button>
              </form>
            )}
          </Card>
        </aside>
      </Container>
    </>
  );
}
