"use client";

import { ArrowRight } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { Button } from "@/components/ui/button";

export function WelcomeAuthCta() {
  const { isSignedIn } = usePublicAuth();

  if (isSignedIn) {
    return (
      <Button asChild size="lg" className="gap-2">
        <PublicAuthLink signedInHref="/today" className="inline-flex">
          Open app <ArrowRight size={18} />
        </PublicAuthLink>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg">
        <PublicAuthLink signedInHref="/today" signedOutHref="/login">
          Create account <ArrowRight size={18} />
        </PublicAuthLink>
      </Button>
      <Button asChild size="lg" variant="secondary">
        <PublicAuthLink signedInHref="/today" signedOutHref="/login">
          Sign in
        </PublicAuthLink>
      </Button>
    </>
  );
}
