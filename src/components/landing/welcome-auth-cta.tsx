"use client";

import { ArrowRight } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { Button } from "@/components/ui/button";

export function WelcomeAuthCta() {
  const { isSignedIn } = usePublicAuth();

  if (isSignedIn) {
    return (
      <PublicAuthLink signedInHref="/today" className="inline-flex">
        <Button size="lg" className="gap-2">
          Open app <ArrowRight size={18} />
        </Button>
      </PublicAuthLink>
    );
  }

  return (
    <>
      <PublicAuthLink signedInHref="/today" signedOutHref="/login">
        <Button size="lg">
          Create account <ArrowRight size={18} />
        </Button>
      </PublicAuthLink>
      <PublicAuthLink signedInHref="/today" signedOutHref="/login">
        <Button size="lg" variant="secondary">
          Sign in
        </Button>
      </PublicAuthLink>
    </>
  );
}

