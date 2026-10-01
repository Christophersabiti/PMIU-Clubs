import { ResetForm } from "@/components/AuthForms";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Choose a new password</h1>
      <div className="mt-6">{sp.token ? <ResetForm token={sp.token} /> : <p className="text-sm text-red-700">This reset link is missing its token.</p>}</div>
    </>
  );
}
