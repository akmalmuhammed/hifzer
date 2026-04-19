import Link from "next/link";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import styles from "./landing.module.css";

const PRODUCT_LINKS = [
  { href: "/#routine", label: "Routine" },
  { href: "/#hifz", label: "Hifz" },
  { href: "/#guidance", label: "Guidance" },
  { href: "/#reflection", label: "Reflection" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className={`${styles.footerFrame} px-5 py-8 sm:px-6 md:px-8`}>
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[color:var(--kw-muted)]">
                Built for Qur&apos;an consistency, hifz retention, trusted guidance, duas, and private reflection.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
                Product
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                {PRODUCT_LINKS.map((link) => (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    telemetryName="marketing.footer-section-link"
                    telemetryMeta={{ section: link.label }}
                    className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
                  >
                    {link.label}
                  </TrackedLink>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
                Support
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <PublicAuthLink
                  signedInHref="/support"
                  signedOutHref="/login?redirect_url=%2Fsupport"
                  className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
                >
                  Support
                </PublicAuthLink>
                <Link href="/legal/privacy" className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Privacy
                </Link>
                <Link href="/legal/terms" className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
