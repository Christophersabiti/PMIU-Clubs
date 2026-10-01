export const TZ = "Africa/Kampala";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function lines(value?: string | null) {
  return (value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function list(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return fmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}
export function formatDay(d: Date | string) {
  return fmt({ weekday: "long", day: "numeric", month: "long" }).format(new Date(d));
}
export function formatTime(d: Date | string) {
  return fmt({ hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(d));
}
export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "";
  return fmt({ day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(d));
}
export function monthShort(d: Date | string) {
  return fmt({ month: "short" }).format(new Date(d)).toUpperCase();
}
export function dayNum(d: Date | string) {
  return fmt({ day: "numeric" }).format(new Date(d));
}

/** Value for <input type="datetime-local"> in Kampala time (UTC+3, no DST). */
export function toLocalInput(d?: Date | null) {
  if (!d) return "";
  const shifted = new Date(new Date(d).getTime() + 3 * 3600_000);
  return shifted.toISOString().slice(0, 16);
}
/** Parse <input type="datetime-local"> / <input type="date"> value as Kampala time. */
export function fromLocalInput(v: FormDataEntryValue | null): Date | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const withTime = s.length === 10 ? `${s}T00:00` : s;
  const d = new Date(`${withTime}:00+03:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
export function optStr(fd: FormData, key: string): string | null {
  return str(fd, key) || null;
}
export function bool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}
export function optInt(fd: FormData, key: string): number | null {
  const n = parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : null;
}
export function optFloat(fd: FormData, key: string): number | null {
  const n = parseFloat(str(fd, key));
  return Number.isFinite(n) ? n : null;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function youtubeEmbed(url?: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function mediaUrl(id?: string | null) {
  return id ? `/api/media/${id}` : null;
}

export function appUrl(path = "") {
  const base =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}

export function eventHours(e: { startsAt: Date; endsAt: Date; impactHours: number | null }) {
  if (e.impactHours != null) return e.impactHours;
  return Math.max(0, Math.round(((e.endsAt.getTime() - e.startsAt.getTime()) / 3600_000) * 10) / 10);
}
