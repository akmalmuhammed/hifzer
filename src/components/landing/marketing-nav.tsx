"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Menu, X } from "lucide-react";
import { UiLanguageSwitcher } from "@/components/app/ui-language-switcher";
import { HifzerMark } from "@/components/brand/hifzer-mark";
import { useUiLanguage } from "@/components/providers/ui-language-provider";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import styles from "./landing.module.css";

const STORY_LINKS = [
  { href: "/#routine", label: "Read" },
  { href: "/#hifz", label: "Memorize" },
  { href: "/#guidance", label: "Understand" },
  { href: "/#reflection", label: "Reflect" },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { language } = useUiLanguage();
  const copy = getAppUiCopy(language);
  const signInLabel = copy.marketing.signIn;
  const getStartedLabel = "Start my routine";
  const brandTagline = "Qur'an reading and hifz, together.";

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className={styles.marketingHeader}>
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

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Landing sections">
              {STORY_LINKS.map((link) => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  telemetryName="marketing.section-link"
                  telemetryMeta={{ section: link.label }}
                  className="rounded-[14px] px-3 py-2 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
                >
                  {link.label}
                </TrackedLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <TrackedLink
                href="/login"
                prefetch={false}
                telemetryName="marketing.sign-in"
                className="rounded-[16px] px-3 py-2.5 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
              >
                {signInLabel}
              </TrackedLink>
              <Button asChild size="md">
                <TrackedLink href="/signup" prefetch={false} telemetryName="marketing.get-started">
                  {getStartedLabel} <ArrowRight size={16} />
                </TrackedLink>
              </Button>

              <UiLanguageSwitcher
                compact
                showIcon
                className="w-[118px]"
                selectClassName="h-[var(--kw-control-md-height)] rounded-[var(--kw-control-md-radius)] bg-[color:var(--kw-surface)] pl-9 pr-3 shadow-[var(--kw-shadow-soft)]"
              />
              <ThemeToggle className="ml-1" />
            </div>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-11 min-h-11 w-11 min-w-11 place-items-center rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)] transition hover:bg-[color:var(--kw-hover-strong)] lg:hidden"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls={menuId}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <nav
          id={menuId}
          aria-label="Mobile navigation"
          className={clsx(styles.mobileMenu, "lg:hidden", open ? "block" : "hidden")}
        >
          <div className={`${styles.mobileMenuPanel} mt-2 px-4 py-4`}>
            <div className="space-y-2">
              <div className="grid gap-1">
                {STORY_LINKS.map((link) => (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    telemetryName="marketing.mobile-section-link"
                    telemetryMeta={{ section: link.label }}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-[16px] px-3 py-2.5 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
                  >
                    {link.label}
                  </TrackedLink>
                ))}
              </div>

              <div className="grid gap-2 pt-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <TrackedLink
                    href="/login"
                    prefetch={false}
                    telemetryName="marketing.mobile-sign-in"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-[18px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2.5 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                  >
                    {signInLabel}
                  </TrackedLink>
                  <Button asChild className="w-full">
                    <TrackedLink
                      href="/signup"
                      prefetch={false}
                      telemetryName="marketing.mobile-get-started"
                      onClick={() => setOpen(false)}
                    >
                      {getStartedLabel} <ArrowRight size={16} />
                    </TrackedLink>
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 border-t border-[color:var(--kw-border)] pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
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
        </nav>
      </div>
    </header>
  );
}
