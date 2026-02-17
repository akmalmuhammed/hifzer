"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePublicAuth } from "@/components/landing/public-auth-context";

type LinkPrefetch = ComponentProps<typeof Link>["prefetch"];

type PublicAuthLinkProps = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  signedInHref: ComponentProps<typeof Link>["href"];
  signedOutHref?: ComponentProps<typeof Link>["href"];
  signedInPrefetch?: LinkPrefetch;
  signedOutPrefetch?: LinkPrefetch;
};

export function PublicAuthLink({
  signedInHref,
  signedOutHref = "/signup",
  signedInPrefetch,
  signedOutPrefetch = false,
  ...props
}: PublicAuthLinkProps) {
  const { authEnabled, isSignedIn } = usePublicAuth();
  const useSignedInRoute = authEnabled && isSignedIn;

  return (
    <Link
      {...props}
      href={useSignedInRoute ? signedInHref : signedOutHref}
      prefetch={useSignedInRoute ? signedInPrefetch : signedOutPrefetch}
    />
  );
}

