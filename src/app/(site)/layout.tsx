import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
      <Footer />
      <MobileTabBar />
    </>
  );
}
