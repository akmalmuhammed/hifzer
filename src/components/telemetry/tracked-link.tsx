"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";
import { capturePosthogEvent } from "@/lib/posthog/client";

type AnchorProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

export type TrackedLinkProps = LinkProps &
  AnchorProps & {
    telemetryName?: string;
    telemetryMeta?: Record<string, unknown>;
    telemetryIgnore?: boolean;
  };

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(function TrackedLink(
  props,
  ref,
) {
  const {
    telemetryName = "tracked-link.click",
    telemetryMeta,
    telemetryIgnore,
    onClick,
    href,
    ...rest
  } = props;

  return (
    <Link
      {...rest}
      ref={ref}
      href={href}
      data-telemetry-ignore={telemetryIgnore ? "1" : undefined}
      onClick={(event) => {
        if (!telemetryIgnore) {
          const hrefValue = typeof href === "string"
            ? href
            : `${href.pathname ?? ""}${href.search ?? ""}${href.hash ?? ""}`;
          capturePosthogEvent("tracked_link_click", {
            name: telemetryName,
            href: hrefValue,
            path: typeof window === "undefined" ? undefined : `${window.location.pathname}${window.location.search}`,
            ...telemetryMeta,
          });
        }
        onClick?.(event);
      }}
    />
  );
});
