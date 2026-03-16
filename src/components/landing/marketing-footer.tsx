import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

export function MarketingFooter() {
  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className={`${styles.footerFrame} px-5 py-8 sm:px-6 md:px-8`}>
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[color:var(--kw-surface)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]">
                  <HifzerMark />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</p>
                  <p className="text-xs text-[color:var(--kw-muted)]">
                    Built by Muslims, for Muslims, seeking Allah&apos;s pleasure.
                  </p>
                </div>
              </div>

              <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--kw-muted)]">
                A calm companion for Qur&apos;an reading, Hifz, guided duas, and steady return without
                turning worship into one loud productivity surface.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="brand">Built by Muslims</Pill>
                <Pill tone="accent">Private by design</Pill>
                <Pill tone="warn">Qur&apos;an-first</Pill>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                Explore
              </p>
              <TrackedLink
                href="/#return"
                telemetryName="footer.return"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                The return
              </TrackedLink>
              <TrackedLink
                href="/#inside"
                telemetryName="footer.inside"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                What&apos;s inside
              </TrackedLink>
              <TrackedLink href="/#personas" telemetryName="footer.personas" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                Who it&apos;s for
              </TrackedLink>
              <TrackedLink href="/#promise" telemetryName="footer.promise" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                The promise
              </TrackedLink>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                Company
              </p>
              <PublicAuthLink
                signedInHref="/today"
                signedOutHref="/signup"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Begin today
              </PublicAuthLink>
              <TrackedLink href="/compare" telemetryName="footer.compare" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                Compare
              </TrackedLink>
              <TrackedLink href="/legal/sources" telemetryName="footer.sources" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                Sources
              </TrackedLink>
              <TrackedLink href="/legal/terms" telemetryName="footer.terms" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                Terms of Service
              </TrackedLink>
              <TrackedLink href="/legal/privacy" telemetryName="footer.privacy" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                Privacy
              </TrackedLink>
              <TrackedLink href="/legal/refund-policy" telemetryName="footer.refund-policy" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                Refund policy
              </TrackedLink>
              <p className="pt-2 text-xs text-[color:var(--kw-faint)]">
                © {new Date().getFullYear()} Hifzer. Built by Muslims, for Muslims, seeking Allah&apos;s pleasure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
