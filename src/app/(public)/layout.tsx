import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { PublicAuthProvider } from "@/components/landing/public-auth-context";
import { Starfield } from "@/components/landing/starfield";
import { PublicBetaBanner } from "@/components/site/public-beta-banner";
import { clerkEnabled } from "@/lib/clerk-config";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const authEnabled = clerkEnabled();

  return (
    <PublicAuthProvider authEnabled={authEnabled}>
      <div className="min-h-dvh">
        <PublicBetaBanner variant="soft" />
        <Starfield />
        <MarketingNav authEnabled={authEnabled} />
        <main id="main-content" className="mx-auto w-full max-w-[1200px] px-4">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </PublicAuthProvider>
  );
}
