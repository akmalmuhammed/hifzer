"use client";

import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { Button } from "@/components/ui/button";

export function PricingAuthCta() {
  const { isSignedIn } = usePublicAuth();

  if (isSignedIn) {
    return (
      <PublicAuthLink signedInHref="/today" className="w-full sm:w-auto">
        <Button size="lg" className="w-full sm:w-auto">
          Open app
        </Button>
      </PublicAuthLink>
    );
  }

  return (
    <>
      <PublicAuthLink signedInHref="/today" signedOutHref="/login" className="w-full sm:w-auto">
        <Button size="lg" className="w-full sm:w-auto">
          Get started
        </Button>
      </PublicAuthLink>
      <PublicAuthLink signedInHref="/today" signedOutHref="/login" className="w-full sm:w-auto">
        <Button size="lg" variant="secondary" className="w-full sm:w-auto">
          Sign in
        </Button>
      </PublicAuthLink>
    </>
  );
}

