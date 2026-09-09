"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";
import { trackProductEvent } from "@/lib/telemetry/client";

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
  function stringifyHref(value: typeof href): string {
    if (typeof value === "string") {
      return value;
    }
    if (value instanceof URL) {
      return value.toString();
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return (
    <Link
      {...rest}
      ref={ref}
      href={href}
      onClick={(event) => {
        if (!telemetryIgnore) {
          trackProductEvent(telemetryName, {
            destination: stringifyHref(href),
            ...telemetryMeta,
          });
        }
        onClick?.(event);
      }}
    />
  );
});
