import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { clerkAuthRoutes } from "@/lib/auth-redirects";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const configured = clerkEnabled();
  if (configured) {
    const { userId } = await auth();
    if (userId) {
      redirect("/today");
    }
  }

  return (
    <div className="space-y-6">
      <Pill tone="neutral">Auth</Pill>
      <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)]">
        Sign in.
        <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Continue your plan.</span>
      </h1>

      <Card>
        {!configured ? (
          <>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Clerk not configured</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              This prototype page is scaffolded. To enable real auth, set Clerk env vars:
            </p>
            <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-3 text-xs leading-6 text-[color:var(--kw-ink-2)]">
              {`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...`}
            </pre>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/">
                <Button variant="secondary" className="gap-2">
                  Back to landing <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid place-items-center py-6">
            <SignIn
              path="/login"
              routing="path"
              forceRedirectUrl={clerkAuthRoutes.signInForceRedirectUrl}
              fallbackRedirectUrl={clerkAuthRoutes.signInFallbackRedirectUrl}
            />
          </div>
        )}
      </Card>

      <p className="text-sm text-[color:var(--kw-muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
          Create one
        </Link>
        .
      </p>
    </div>
  );
}
