"use client";

import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { Button } from "@/components/ui/button";

export function PricingAuthCta() {
  const { isSignedIn } = usePublicAuth();

  if (isSignedIn) {
    return (
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <PublicAuthLink signedInHref="/billing/upgrade" signedOutHref="/signup" className="w-full sm:w-auto">
            Upgrade plan
          </PublicAuthLink>
        </Button>
        <PublicAuthLink
          signedInHref="/today"
          className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
        >
          Open app
        </PublicAuthLink>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 sm:w-auto">
      <Button asChild size="lg" className="w-full sm:w-auto">
        <PublicAuthLink signedInHref="/today" signedOutHref="/signup" className="w-full sm:w-auto">
          Start free
        </PublicAuthLink>
      </Button>
      <PublicAuthLink
        signedInHref="/today"
        signedOutHref="/login"
        className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
      >
        Sign in
      </PublicAuthLink>
    </div>
  );
}
