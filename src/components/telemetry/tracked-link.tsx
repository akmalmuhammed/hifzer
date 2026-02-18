"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";

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
  void telemetryName;
  void telemetryMeta;
  void telemetryIgnore;

  return (
    <Link
      {...rest}
      ref={ref}
      href={href}
      onClick={(event) => {
        onClick?.(event);
      }}
    />
  );
});
