import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { joinClub } from "@/app/actions/member";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Container, Textarea } from "@/components/ui";

export const metadata = { title: "Join club" };

export default async function JoinPage({ params }: PageProps<"/clubs/[slug]/join">) {
  const { slug } = await params;
  const club = await db.club.findUnique({ where: { slug } });
  if (!club) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/register?next=${encodeURIComponent(`/clubs/${slug}/join`)}`);
  if (!user.profileCompleted) redirect(`/onboarding?next=${encodeURIComponent(`/clubs/${slug}/join`)}`);
  const existing = await db.clubMembership.findUnique({ where: { userId_clubId: { userId: user.id, clubId: club.id } } });
  if (existing && (existing.status === "ACTIVE" || existing.status === "PENDING")) redirect(`/clubs/${slug}`);

  return (
    <Container className="max-w-xl py-12">
      <Card className="p-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Join</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">{club.name}</h1>
        <p className="mt-2 text-sm text-muted">{club.description}</p>
        <ActionForm action={joinClub} className="mt-6 space-y-4">
          <input type="hidden" name="clubId" value={club.id} />
          <input type="hidden" name="redirect" value="1" />
          <Textarea
            label={club.requiresApproval ? "Why would you like to join?" : "Anything the Club Captain should know? (optional)"}
            name="motivation"
            required={club.requiresApproval}
            maxLength={1000}
            hint={club.requiresApproval ? "All club memberships are reviewed — a club administrator will approve your request." : undefined}
          />
          <SubmitButton variant="primary" pendingText="Sending…">{club.requiresApproval ? "Send join request" : "Join club"}</SubmitButton>
        </ActionForm>
      </Card>
    </Container>
  );
}
