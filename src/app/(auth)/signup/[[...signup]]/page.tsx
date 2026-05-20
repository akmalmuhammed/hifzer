import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignUp } from "@clerk/nextjs";
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
  title: "Signup",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignupPage(props: {
  searchParams?: AuthSearchParams | Promise<AuthSearchParams>;
}) {
  const searchParams = await resolveSearchParams(props.searchParams);
  const redirectPath = safeAuthRedirectPath(
    searchParams.redirect_url,
    clerkAuthRoutes.signUpForceRedirectUrl,
  );
  const signInHref = `/login?redirect_url=${encodeURIComponent(redirectPath)}`;
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
        Create your account.
        <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Start with any surah.</span>
      </h1>

      <Card>
        {!configured ? (
          <>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Account creation is temporarily unavailable</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              You can still preview the Qur&apos;an reader without creating an account. Saving progress, bookmarks,
              and connected Quran.com memory will be available after sign-in is restored.
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
            <SignUp
              path="/signup"
              routing="path"
              forceRedirectUrl={redirectPath}
              fallbackRedirectUrl={redirectPath}
            />
          </div>
        )}
      </Card>

      <p className="text-sm text-[color:var(--kw-muted)]">
        Already have an account?{" "}
        <Link href={signInHref} className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
