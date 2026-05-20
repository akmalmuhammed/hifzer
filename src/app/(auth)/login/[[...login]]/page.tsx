import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { clerkAuthRoutes, safeAuthRedirectPath } from "@/lib/auth-redirects";
import { clerkEnabled } from "@/lib/clerk-config";

type AuthSearchParams = Record<string, string | string[] | undefined>;

async function resolveSearchParams(searchParams: AuthSearchParams | Promise<AuthSearchParams> | undefined) {
  return searchParams ? await searchParams : {};
}

export const metadata = {
  title: "Login",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage(props: {
  searchParams?: AuthSearchParams | Promise<AuthSearchParams>;
}) {
  const searchParams = await resolveSearchParams(props.searchParams);
  const redirectPath = safeAuthRedirectPath(
    searchParams.redirect_url,
    clerkAuthRoutes.signInForceRedirectUrl,
  );
  const signUpHref = `/signup?redirect_url=${encodeURIComponent(redirectPath)}`;
  const configured = clerkEnabled();
  if (configured) {
    const { userId } = await auth();
    if (userId) {
      redirect(redirectPath);
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
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Sign-in is temporarily unavailable</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Account access is not available in this environment. You can still preview the reader or return to
              the landing page.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/quran/read?view=compact&anon=1&surah=1&cursor=1&translation=1&tafsir=1&ignoreSaved=1">
                <Button className="gap-2">
                  Preview reader <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" className="gap-2">
                  Back to landing <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid w-full min-w-0 place-items-center overflow-hidden py-6 [&_.cl-cardBox]:max-w-full [&_.cl-rootBox]:max-w-full">
            <SignIn
              path="/login"
              routing="path"
              forceRedirectUrl={redirectPath}
              fallbackRedirectUrl={redirectPath}
            />
          </div>
        )}
      </Card>

      <p className="text-sm text-[color:var(--kw-muted)]">
        Don&apos;t have an account?{" "}
        <Link href={signUpHref} className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
          Create one
        </Link>
        .
      </p>
    </div>
  );
}
