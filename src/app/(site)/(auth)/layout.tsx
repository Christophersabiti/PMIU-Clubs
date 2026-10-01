import { Container } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-bg">
      <Container className="grid min-h-[70vh] items-center gap-10 py-12 lg:grid-cols-2">
        <div className="hidden text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">One account · every club</p>
          <h2 className="mt-3 font-display text-5xl font-semibold">Connect. Participate. Grow. Impact.</h2>
          <p className="mt-4 max-w-md text-brand-100">Join Toastmasters, Fitness, Coaching, Health & Safety and Rotary clubs with a single PMI Uganda Clubs account, and keep one engagement history.</p>
        </div>
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">{children}</div>
      </Container>
    </div>
  );
}
