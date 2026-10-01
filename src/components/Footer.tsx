import Image from "next/image";
import Link from "next/link";
import { NAV } from "./Header";

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-950 pb-24 text-brand-100 lg:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image src="/brand/pmi-uganda-logo-white.png" alt="PMI Uganda" width={140} height={56} className="h-12 w-auto" />
          <p className="mt-4 font-display text-xl text-gold-400">Connect. Participate. Grow. Impact.</p>
          <p className="mt-2 text-sm">The digital engagement hub for PMI Uganda Chapter Clubs.</p>
        </div>
        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">Explore</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-white">{n.label}</Link>
              </li>
            ))}
            <li><Link href="/directory" className="hover:text-white">Members</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">PMI Uganda Chapter</p>
          <p className="mt-3">Chartered 2014 · Sub-Saharan Africa region</p>
          <p className="mt-1"><a href="https://pmiuganda.org" className="underline hover:text-white" target="_blank" rel="noreferrer">pmiuganda.org</a></p>
          <p className="mt-6 text-xs text-brand-300">© {new Date().getFullYear()} PMI Uganda Chapter. PMI and PMP are registered marks of the Project Management Institute, Inc.</p>
        </div>
      </div>
    </footer>
  );
}
