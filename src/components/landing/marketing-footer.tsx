import Link from "next/link";
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
              <h2 className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[color:var(--kw-muted)]">
                Built for Qur&apos;an consistency, hifz retention, trusted guidance, duas, and private reflection.
              </p>
            </div>

            <nav aria-labelledby="footer-explore-heading">
              <h2 id="footer-explore-heading" className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-muted)]">
                Explore
              </h2>
              <div className="mt-3 grid gap-2 text-sm">
                {PRODUCT_LINKS.map((link) => (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    telemetryName="marketing.footer-section-link"
                    telemetryMeta={{ section: link.label }}
                    className="flex min-h-8 items-center text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
                  >
                    {link.label}
                  </TrackedLink>
                ))}
              </div>
            </nav>

            <nav aria-labelledby="footer-help-heading">
              <h2 id="footer-help-heading" className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-muted)]">
                Help
              </h2>
              <div className="mt-3 grid gap-2 text-sm">
                <Link
                  href="/login?redirect_url=%2Fsupport"
                  className="flex min-h-8 items-center text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
                >
                  Help
                </Link>
                <Link href="/legal/sources" className="flex min-h-8 items-center text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Qur&apos;an sources
                </Link>
                <Link href="/legal/privacy" className="flex min-h-8 items-center text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Privacy
                </Link>
                <Link href="/legal/terms" className="flex min-h-8 items-center text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Terms
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
