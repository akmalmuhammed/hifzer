"use client";

import type { ComponentProps } from "react";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { TrackedLink } from "@/components/telemetry/tracked-link";

type LinkPrefetch = ComponentProps<typeof TrackedLink>["prefetch"];

type PublicAuthLinkProps = Omit<ComponentProps<typeof TrackedLink>, "href" | "prefetch"> & {
  signedInHref: ComponentProps<typeof TrackedLink>["href"];
  signedOutHref?: ComponentProps<typeof TrackedLink>["href"];
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
    <TrackedLink
      {...props}
      href={useSignedInRoute ? signedInHref : signedOutHref}
      prefetch={useSignedInRoute ? signedInPrefetch : signedOutPrefetch}
    />
  );
}
