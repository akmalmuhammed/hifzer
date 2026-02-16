import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <MarketingNav />
      <main id="main-content" className="mx-auto w-full max-w-[1200px] px-4">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
