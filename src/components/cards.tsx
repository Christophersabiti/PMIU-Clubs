import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, ExternalLink, FileText, Globe2, MapPin, PlaySquare, Video, Wrench, BookOpen, Link2 } from "lucide-react";
import { dayNum, formatDate, formatTime, monthShort, cn } from "@/lib/utils";
import { ClubIcon } from "./ClubIcon";
import { Badge } from "./ui";

type ClubLite = { slug: string; shortName: string; name: string; tagline: string | null; summary: string | null; accent: string; icon: string; coverImage: string | null };

export function ClubCard({ club, memberCount, joined }: { club: ClubLite; memberCount?: number; joined?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-40 overflow-hidden bg-brand-900">
        {club.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={club.coverImage} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 to-transparent" />
        <span className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow" style={{ background: club.accent }}>
          <ClubIcon name={club.icon} className="h-5 w-5" />
        </span>
        {joined && <Badge tone="gold" className="absolute right-4 top-4">✓ Member</Badge>}
        <p className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-widest text-gold-300">{club.tagline}</p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl font-semibold text-brand-950">{club.shortName}</h3>
        <p className="mt-1 flex-1 text-sm text-muted">{club.summary}</p>
        <div className="mt-4 flex items-center justify-between">
          {memberCount !== undefined && <span className="text-xs text-muted">{memberCount} members</span>}
          <Link href={`/clubs/${club.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 after:absolute after:inset-0 group-hover:gap-2">
            Explore Club <ArrowRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">: {club.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

const MODE: Record<string, { label: string; tone: "brand" | "blue" | "green" }> = {
  PHYSICAL: { label: "In person", tone: "green" },
  ONLINE: { label: "Online", tone: "blue" },
  HYBRID: { label: "Hybrid", tone: "brand" },
};

type EventLite = {
  id: string; title: string; summary: string | null; startsAt: Date; endsAt: Date; mode: string; locationName: string | null; status: string;
  club: { shortName: string; accent: string };
};

export function EventCard({ event, registered, compact }: { event: EventLite; registered?: boolean; compact?: boolean }) {
  const mode = MODE[event.mode] ?? MODE.PHYSICAL;
  return (
    <article className="group relative flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-brand-100 transition hover:shadow-md">
      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ background: event.club.accent }}>
        <span className="text-[11px] font-bold tracking-wider">{monthShort(event.startsAt)}</span>
        <span className="font-display text-2xl font-semibold leading-none">{dayNum(event.startsAt)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="gray">{event.club.shortName}</Badge>
          <Badge tone={mode.tone}>{mode.label}</Badge>
          {event.status === "CANCELLED" && <Badge tone="red">Cancelled</Badge>}
          {registered && <Badge tone="green">Registered ✓</Badge>}
        </div>
        <h3 className="mt-1.5 font-semibold leading-snug text-brand-950">
          <Link href={`/events/${event.id}`} className="after:absolute after:inset-0">{event.title}</Link>
        </h3>
        {!compact && event.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{event.summary}</p>}
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{formatTime(event.startsAt)}</span>
          {event.locationName && event.mode !== "ONLINE" && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{event.locationName}</span>
          )}
          {event.mode === "ONLINE" && <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" aria-hidden />Online</span>}
        </p>
      </div>
    </article>
  );
}

const ACT_TYPE: Record<string, string> = { SESSION: "Session", CHALLENGE: "Challenge", TRAINING: "Training", PROJECT: "Community project", VOLUNTEER: "Volunteer", SOCIAL: "Social" };
const ACT_STATUS: Record<string, { label: string; tone: "gray" | "green" | "brand" }> = {
  PLANNED: { label: "Upcoming", tone: "brand" },
  ACTIVE: { label: "Active now", tone: "green" },
  COMPLETED: { label: "Completed", tone: "gray" },
};
export const ACTIVITY_TYPES = ACT_TYPE;

type ActivityLite = { id: string; title: string; summary: string | null; type: string; status: string; startDate: Date | null; isVolunteer: boolean; club: { shortName: string; accent: string }; initiative?: { title: string } | null };

export function ActivityCard({ activity }: { activity: ActivityLite }) {
  const st = ACT_STATUS[activity.status] ?? ACT_STATUS.PLANNED;
  return (
    <article className="relative flex flex-col rounded-2xl bg-white p-5 ring-1 ring-brand-100 transition hover:shadow-md">
      <div className="h-1 w-12 rounded-full" style={{ background: activity.club.accent }} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="gray">{activity.club.shortName}</Badge>
        <Badge tone={st.tone}>{st.label}</Badge>
        {activity.isVolunteer && <Badge tone="gold">Volunteer</Badge>}
      </div>
      <h3 className="mt-2 font-semibold text-brand-950">
        <Link href={`/activities/${activity.id}`} className="after:absolute after:inset-0">{activity.title}</Link>
      </h3>
      {activity.initiative && <p className="text-xs text-brand-600">{activity.initiative.title}</p>}
      {activity.summary && <p className="mt-1.5 line-clamp-3 text-sm text-muted">{activity.summary}</p>}
      <p className="mt-auto pt-3 text-xs text-muted">
        {ACT_TYPE[activity.type] ?? activity.type}
        {activity.startDate && <> · from {formatDate(activity.startDate)}</>}
      </p>
    </article>
  );
}

type PostLite = { slug: string; title: string; excerpt: string | null; type: string; coverImage: string | null; publishedAt: Date | null; createdAt: Date; club: { shortName: string } | null };
const POST_TYPE: Record<string, string> = { NEWS: "News", ANNOUNCEMENT: "Announcement", IMPACT_STORY: "Impact story" };
export const POST_TYPES = POST_TYPE;

export function PostCard({ post, horizontal }: { post: PostLite; horizontal?: boolean }) {
  return (
    <article className={cn("group relative overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100 transition hover:shadow-md", horizontal && "flex")}>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className={cn("object-cover", horizontal ? "h-auto w-28 shrink-0" : "h-40 w-full")} />
      )}
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={post.type === "ANNOUNCEMENT" ? "gold" : post.type === "IMPACT_STORY" ? "green" : "brand"}>{POST_TYPE[post.type]}</Badge>
          {post.club && <Badge tone="gray">{post.club.shortName}</Badge>}
        </div>
        <h3 className="mt-2 font-semibold leading-snug text-brand-950">
          <Link href={`/news/${post.slug}`} className="after:absolute after:inset-0">{post.title}</Link>
        </h3>
        {!horizontal && post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{post.excerpt}</p>}
        <p className="mt-2 flex items-center gap-1 text-xs text-muted"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{formatDate(post.publishedAt ?? post.createdAt)}</p>
      </div>
    </article>
  );
}

const RES_ICON = { ARTICLE: BookOpen, VIDEO: PlaySquare, DOCUMENT: FileText, TEMPLATE: Wrench, LINK: Link2 } as const;
export const RESOURCE_TYPES: Record<string, string> = { ARTICLE: "Article", VIDEO: "Video", DOCUMENT: "Document", TEMPLATE: "Template", LINK: "External link" };

type ResourceLite = { id: string; title: string; description: string | null; type: string; isPartnerResource: boolean; mediaId: string | null; club: { shortName: string } | null; partner: { name: string } | null };

export function ResourceItem({ resource }: { resource: ResourceLite }) {
  const Icon = RES_ICON[resource.type as keyof typeof RES_ICON] ?? Link2;
  return (
    <li className="relative flex items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-brand-100 hover:shadow-md">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <a href={`/api/resources/${resource.id}`} target="_blank" rel="noreferrer" className="font-semibold text-brand-950 after:absolute after:inset-0 hover:underline">
          {resource.title}
        </a>
        {resource.description && <p className="mt-0.5 text-sm text-muted">{resource.description}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="gray">{resource.mediaId ? "PDF" : RESOURCE_TYPES[resource.type]}</Badge>
          {resource.club && <Badge tone="brand">{resource.club.shortName}</Badge>}
          {resource.isPartnerResource && resource.partner && <Badge tone="gold">Partner · {resource.partner.name}</Badge>}
        </div>
      </div>
      {resource.type === "VIDEO" ? <Video className="h-4 w-4 text-muted" aria-hidden /> : <ExternalLink className="h-4 w-4 text-muted" aria-hidden />}
    </li>
  );
}
