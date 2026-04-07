"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";
import { trackGaEvent } from "@/lib/ga/client";

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
  function normalizeValue(value: unknown): string | number | boolean | null | undefined {
    if (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }
    return JSON.stringify(value);
  }

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
          trackGaEvent(telemetryName, {
            href: stringifyHref(href),
            ...Object.fromEntries(
              Object.entries(telemetryMeta ?? {}).map(([key, value]) => [key, normalizeValue(value)]),
            ),
          });
        }
        onClick?.(event);
      }}
    />
  );
});
