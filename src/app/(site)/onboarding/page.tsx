import { requireUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { completeOnboarding } from "@/app/actions/member";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ProfileFields } from "@/components/ProfileFields";
import { Card, Container } from "@/components/ui";

export const metadata = { title: "Complete your profile" };

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireUser("/onboarding");
  const next = safeNext(sp.next);
  return (
    <Container className="max-w-3xl py-10">
      <ol className="mb-6 flex flex-wrap gap-2 text-xs font-semibold" aria-label="Progress">
        {["Create account", "Complete profile", "Select interests", "Join clubs"].map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-1 ${i <= 2 ? "bg-brand-700 text-white" : "bg-brand-100 text-brand-800"}`} aria-current={i === 1 ? "step" : undefined}>{i + 1}. {s}</li>
        ))}
      </ol>
      <Card className="p-7">
        <h1 className="font-display text-3xl font-semibold">Welcome, {user.name.split(" ")[0]}! Let&apos;s set up your profile.</h1>
        <p className="mt-1 text-sm text-muted">This takes about a minute and helps Club Captains and partners tailor activities.</p>
        <ActionForm action={completeOnboarding} className="mt-8">
          <input type="hidden" name="next" value={next} />
          <ProfileFields user={user} compact />
          <div className="mt-8"><SubmitButton pendingText="Saving…">Save and continue</SubmitButton></div>
        </ActionForm>
      </Card>
    </Container>
  );
}
