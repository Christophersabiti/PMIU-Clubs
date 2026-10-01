import { Activity, Compass, Globe, Mic, Shield, Users, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { mic: Mic, activity: Activity, compass: Compass, shield: Shield, globe: Globe, users: Users };
export const CLUB_ICON_OPTIONS = Object.keys(ICONS);

export function ClubIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Users;
  return <Icon aria-hidden className={className} />;
}
