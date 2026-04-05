"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { UiLanguageSwitcher } from "@/components/app/ui-language-switcher";
import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { useUiLanguage } from "@/components/providers/ui-language-provider";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import styles from "./landing-home.module.css";

export function MarketingNav(props: { authEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = usePublicAuth();
  const { language } = useUiLanguage();
  const copy = getAppUiCopy(language);
  const showSignedIn = props.authEnabled && isSignedIn;
  const signInLabel = language === "en.sahih" ? "Sign in" : copy.marketing.signIn;
  const getStartedLabel = language === "en.sahih" ? "Join Hifzer" : copy.marketing.getStarted;
  const openAppLabel = language === "en.sahih" ? "Open App" : copy.marketing.openApp;
  const brandTagline =
    language === "en.sahih" ? "A quieter Qur'an companion" : copy.brandTagline;
  const links = [
    { href: "/#companion", label: "Companion", key: "companion" },
    { href: "/#method", label: "Method", key: "method" },
    { href: "/quran-preview", label: "Preview", key: "preview" },
  ] as const;

  return (
    <header className="sticky top-0 z-40">
      <div className={styles.navWrap}>
        <div className={styles.navFrame}>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <TrackedLink href="/" className="flex items-center gap-3" telemetryName="marketing.logo">
              <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[color:var(--kw-surface)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]">
                <HifzerMark />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  Hifzer
                </span>
                <span className="block text-xs text-[color:var(--kw-muted)]">{brandTagline}</span>
              </span>
            </TrackedLink>

            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((link) => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  telemetryName={`marketing.nav.${link.key}`}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
                >
                  {link.label}
                </TrackedLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              {showSignedIn ? (
                <>
                  <Button asChild size="md">
                    <TrackedLink href="/today" telemetryName="marketing.open-app">
                      {openAppLabel}
                    </TrackedLink>
                  </Button>
                  <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] shadow-[var(--kw-shadow-soft)]">
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
                    {signInLabel}
                  </PublicAuthLink>
                  <Button asChild size="md">
                    <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                      {getStartedLabel} <ArrowRight size={16} />
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
              className="grid h-11 w-11 place-items-center rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)] transition hover:bg-[color:var(--kw-hover-strong)] lg:hidden"
              aria-label={copy.marketing.toggleMenu}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <div className={clsx("lg:hidden", open ? "block" : "hidden")}>
          <div className="mt-2 rounded-[26px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card-strong)] px-4 py-4 shadow-[var(--kw-shadow)] backdrop-blur">
            <div className="space-y-2">
              {links.map((link) => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  telemetryName={`marketing.mobile-nav.${link.key}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-[18px] px-3 py-2.5 text-sm font-semibold text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-soft)]"
                >
                  {link.label}
                </TrackedLink>
              ))}

              <div className="grid gap-2 pt-2">
                {showSignedIn ? (
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <TrackedLink
                      href="/today"
                      telemetryName="marketing.mobile-open-app"
                      onClick={() => setOpen(false)}
                      className="rounded-[18px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2.5 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                    >
                      {openAppLabel}
                    </TrackedLink>
                    <div className="flex justify-center sm:justify-end">
                      <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] shadow-[var(--kw-shadow-soft)]">
                        <UserButton afterSignOutUrl="/" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <PublicAuthLink
                      signedInHref="/today"
                      signedOutHref="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-[18px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2.5 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                    >
                      {signInLabel}
                    </PublicAuthLink>
                    <Button asChild className="w-full">
                      <PublicAuthLink
                        signedInHref="/today"
                        signedOutHref="/signup"
                        onClick={() => setOpen(false)}
                      >
                        {getStartedLabel} <ArrowRight size={16} />
                      </PublicAuthLink>
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <UiLanguageSwitcher compact onChanged={() => setOpen(false)} />
                <div className="flex justify-center sm:justify-end">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
