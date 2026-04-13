import Link from "next/link";
import styles from "./landing-home.module.css";

export function MarketingFooter() {
  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className={`${styles.footerFrame} px-5 py-8 sm:px-6 md:px-8`}>
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[color:var(--kw-muted)]">
                One companion app for Qur&apos;an reading, hifz, duas, and private notes.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
                Explore
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <Link href="/quran-preview" className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Qur&apos;an preview
                </Link>
                <Link href="/compare" className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Compare
                </Link>
                <Link href="/changelog" className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Changelog
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
                Support
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <Link href="/support" className="text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]">
                  Support
                </Link>
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
