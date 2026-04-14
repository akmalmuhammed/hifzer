"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, Menu, X } from "lucide-react";
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

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const { language } = useUiLanguage();
  const { isSignedIn } = usePublicAuth();
  const copy = getAppUiCopy(language);
  const signInLabel = copy.marketing.signIn;
  const getStartedLabel = "Start free";
  const brandTagline = "One guided place to return to the Qur'an daily.";

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

            <div className="hidden items-center gap-2 lg:flex">
              {isSignedIn ? (
                <Button asChild size="md">
                  <PublicAuthLink signedInHref="/dashboard" telemetryName="marketing.open-app">
                    Open app <ArrowRight size={16} />
                  </PublicAuthLink>
                </Button>
              ) : (
                <>
                  <PublicAuthLink
                    signedInHref="/dashboard"
                    signedOutHref="/login"
                    telemetryName="marketing.sign-in"
                    className="rounded-[16px] px-3 py-2.5 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
                  >
                    {signInLabel}
                  </PublicAuthLink>
                  <Button asChild size="md">
                    <PublicAuthLink
                      signedInHref="/dashboard"
                      signedOutHref="/signup"
                      telemetryName="marketing.get-started"
                    >
                      {getStartedLabel} <ArrowRight size={16} />
                    </PublicAuthLink>
                  </Button>
                </>
              )}

              <UiLanguageSwitcher
                compact
                showIcon
                className="w-[118px]"
                selectClassName="h-[var(--kw-control-md-height)] rounded-[var(--kw-control-md-radius)] bg-[color:var(--kw-surface)] pl-9 pr-3 shadow-[var(--kw-shadow-soft)]"
              />
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
              <div className="grid gap-2 pt-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  {isSignedIn ? (
                    <Button asChild className="w-full sm:col-span-2">
                      <PublicAuthLink
                        signedInHref="/dashboard"
                        telemetryName="marketing.mobile-open-app"
                        onClick={() => setOpen(false)}
                      >
                        Open app <ArrowRight size={16} />
                      </PublicAuthLink>
                    </Button>
                  ) : (
                    <>
                      <PublicAuthLink
                        signedInHref="/dashboard"
                        signedOutHref="/login"
                        telemetryName="marketing.mobile-sign-in"
                        onClick={() => setOpen(false)}
                        className="rounded-[18px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2.5 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                      >
                        {signInLabel}
                      </PublicAuthLink>
                      <Button asChild className="w-full">
                        <PublicAuthLink
                          signedInHref="/dashboard"
                          signedOutHref="/signup"
                          telemetryName="marketing.mobile-get-started"
                          onClick={() => setOpen(false)}
                        >
                          {getStartedLabel} <ArrowRight size={16} />
                        </PublicAuthLink>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <UiLanguageSwitcher
                  compact
                  showIcon
                  onChanged={() => setOpen(false)}
                  selectClassName="h-[var(--kw-control-md-height)] rounded-[var(--kw-control-md-radius)] bg-[color:var(--kw-surface)] pl-9 pr-3 shadow-[var(--kw-shadow-soft)]"
                />
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
