import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { PublicAuthProvider } from "@/components/landing/public-auth-context";
import { PublicBetaBanner } from "@/components/site/public-beta-banner";
import { clerkEnabled } from "@/lib/clerk-config";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const authEnabled = clerkEnabled();

  return (
    <PublicAuthProvider authEnabled={authEnabled}>
      <div className="min-h-dvh">
        <PublicBetaBanner variant="soft" />
        <MarketingNav authEnabled={authEnabled} />
        <main id="main-content" className="w-full overflow-x-hidden">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </PublicAuthProvider>
  );
}
