import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { PublicAuthProvider } from "@/components/landing/public-auth-context";
import { clerkEnabled } from "@/lib/clerk-config";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const authEnabled = clerkEnabled();

  return (
    <PublicAuthProvider authEnabled={authEnabled}>
      <div className="min-h-dvh">
        {/* Subtle Islamic geometric pattern + drifting glow orbs */}
        <div className="kw-islamic-pattern" aria-hidden="true" />
        <div className="kw-glow-wrap" aria-hidden="true">
          <div className="kw-glow-orb kw-glow-orb--1" />
          <div className="kw-glow-orb kw-glow-orb--2" />
          <div className="kw-glow-orb kw-glow-orb--3" />
        </div>

        <MarketingNav authEnabled={authEnabled} />
        <main id="main-content" className="w-full overflow-x-hidden">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </PublicAuthProvider>
  );
}
