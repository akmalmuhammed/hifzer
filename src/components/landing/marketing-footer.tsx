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
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div>
            <h2 className={styles.footerHeading}>Hifzer</h2>
            <p className={styles.footerBlurb}>
              Built for Qur&apos;an consistency, hifz retention, trusted guidance, duas, and private reflection.
            </p>
          </div>

          <nav aria-labelledby="footer-explore-heading">
            <h2 id="footer-explore-heading" className={styles.footerHeading}>
              Explore
            </h2>
            <div className={styles.footerLinks}>
              {PRODUCT_LINKS.map((link) => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  telemetryName="marketing.footer-section-link"
                  telemetryMeta={{ section: link.label }}
                >
                  {link.label}
                </TrackedLink>
              ))}
            </div>
          </nav>

          <nav aria-labelledby="footer-help-heading">
            <h2 id="footer-help-heading" className={styles.footerHeading}>
              Help
            </h2>
            <div className={styles.footerLinks}>
              <Link href="/login?redirect_url=%2Fsupport">Help</Link>
              <Link href="/legal/sources">Qur&apos;an sources</Link>
              <Link href="/legal/privacy">Privacy</Link>
              <Link href="/legal/terms">Terms</Link>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}
