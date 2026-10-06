"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
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

const languageSelectClassName =
  "h-8 rounded-full border-transparent bg-[color:var(--kw-fill-strong)] pl-8 pr-2 text-[0.82rem]";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { language } = useUiLanguage();
  const copy = getAppUiCopy(language);
  const signInLabel = copy.marketing.signIn;
  const getStartedLabel = "Start my routine";

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
      <div className={styles.navBar}>
        <TrackedLink href="/" className={styles.navBrand} telemetryName="marketing.logo">
          <HifzerMark />
          <span>Hifzer</span>
        </TrackedLink>

        <nav className={styles.navLinks} aria-label="Landing sections">
          {STORY_LINKS.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              prefetch={false}
              telemetryName="marketing.section-link"
              telemetryMeta={{ section: link.label }}
              className={styles.navLink}
            >
              {link.label}
            </TrackedLink>
          ))}
        </nav>

        <div className={styles.navActions}>
          <TrackedLink
            href="/login"
            prefetch={false}
            telemetryName="marketing.sign-in"
            className={styles.navLink}
          >
            {signInLabel}
          </TrackedLink>
          <Button asChild size="sm">
            <TrackedLink href="/signup" prefetch={false} telemetryName="marketing.get-started">
              {getStartedLabel}
            </TrackedLink>
          </Button>
          <UiLanguageSwitcher
            compact
            showIcon
            className="w-[112px]"
            selectClassName={languageSelectClassName}
          />
          <ThemeToggle className="!h-8 !w-8" />
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={styles.navMenuButton}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls={menuId}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav id={menuId} aria-label="Mobile navigation" className={styles.mobileMenu} hidden={!open}>
        {STORY_LINKS.map((link) => (
          <TrackedLink
            key={link.href}
            href={link.href}
            prefetch={false}
            telemetryName="marketing.mobile-section-link"
            telemetryMeta={{ section: link.label }}
            onClick={() => setOpen(false)}
            className={styles.mobileMenuLink}
          >
            {link.label}
          </TrackedLink>
        ))}

        <div className={styles.mobileMenuActions}>
          <Button asChild size="lg" className="w-full">
            <TrackedLink
              href="/signup"
              prefetch={false}
              telemetryName="marketing.mobile-get-started"
              onClick={() => setOpen(false)}
            >
              {getStartedLabel}
            </TrackedLink>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full">
            <TrackedLink
              href="/login"
              prefetch={false}
              telemetryName="marketing.mobile-sign-in"
              onClick={() => setOpen(false)}
            >
              {signInLabel}
            </TrackedLink>
          </Button>
        </div>

        <div className={styles.mobileMenuUtility}>
          <UiLanguageSwitcher
            compact
            showIcon
            className="w-[140px]"
            onChanged={() => setOpen(false)}
            selectClassName="h-11 rounded-full border-transparent bg-[color:var(--kw-fill-strong)] pl-9 pr-3"
          />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
