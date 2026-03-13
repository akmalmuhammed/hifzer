"use client";

import { useState } from "react";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { UiLanguageSwitcher } from "@/components/app/ui-language-switcher";
import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { useUiLanguage } from "@/components/providers/ui-language-provider";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";

const LINKS = [
  { href: "/compare", key: "compare" as const },
] as const;

export function MarketingNav(props: { authEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = usePublicAuth();
  const { language } = useUiLanguage();
  const copy = getAppUiCopy(language);
  const showSignedIn = props.authEnabled && isSignedIn;

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3">
          <TrackedLink href="/" className="flex items-center gap-3" telemetryName="marketing.logo">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[color:var(--kw-surface-soft)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)] backdrop-blur-md">
              <HifzerMark />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Hifzer
              </span>
              <span className="block text-xs text-[color:var(--kw-muted)]">
                {copy.brandTagline}
              </span>
            </span>
          </TrackedLink>

          <nav className="hidden items-center gap-5 md:flex">
            {LINKS.map((l) => (
              <TrackedLink
                key={l.href}
                href={l.href}
                telemetryName={`marketing.nav.${l.key}`}
                className="text-sm font-semibold text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
              >
                {copy.marketing.compare}
              </TrackedLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {showSignedIn ? (
              <>
                <Button asChild size="md">
                  <TrackedLink href="/today" telemetryName="marketing.open-app">
                    {copy.marketing.openApp}
                  </TrackedLink>
                </Button>
                <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] shadow-[var(--kw-shadow-soft)]">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <>
                <PublicAuthLink
                  signedInHref="/today"
                  signedOutHref="/login"
                  className="rounded-[16px] px-3 py-2.5 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
                >
                  {copy.marketing.signIn}
                </PublicAuthLink>
                <Button asChild size="md">
                  <PublicAuthLink signedInHref="/today" signedOutHref="/login">
                    {copy.marketing.getStarted}
                  </PublicAuthLink>
                </Button>
              </>
            )}

            <UiLanguageSwitcher compact className="w-[132px]" />
            <ThemeToggle className="ml-1" />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-[16px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-[color:var(--kw-hover-strong)] md:hidden"
            aria-label={copy.marketing.toggleMenu}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="border-b border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-[1200px] space-y-2">
            {LINKS.map((l) => (
              <TrackedLink
                key={l.href}
                href={l.href}
                telemetryName={`marketing.mobile-nav.${l.key}`}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-soft)]"
              >
                {copy.marketing.compare}
              </TrackedLink>
            ))}
            <div className="flex gap-2 pt-1">
              {showSignedIn ? (
                <>
                  <TrackedLink
                    href="/today"
                    telemetryName="marketing.mobile-open-app"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2.5 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                  >
                    {copy.marketing.openApp}
                  </TrackedLink>
                  <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] shadow-[var(--kw-shadow-soft)]">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <PublicAuthLink
                    signedInHref="/today"
                    signedOutHref="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2.5 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                  >
                    {copy.marketing.signIn}
                  </PublicAuthLink>
                  <Button asChild className="w-full">
                    <PublicAuthLink signedInHref="/today" signedOutHref="/login" onClick={() => setOpen(false)} className="flex-1">
                      {copy.marketing.getStarted}
                    </PublicAuthLink>
                  </Button>
                </>
              )}
            </div>
            <div className="pt-1">
              <UiLanguageSwitcher compact onChanged={() => setOpen(false)} />
            </div>
            <div className="mt-3 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
