import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { TrackedLink } from "@/components/telemetry/tracked-link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] backdrop-blur">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[color:var(--kw-surface-soft)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)] backdrop-blur-md">
              <HifzerMark />
            </span>
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</p>
              <p className="text-xs text-[color:var(--kw-muted)]">
                Hifz operating system.
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[color:var(--kw-muted)]">
            Plan your day, practice with intention, and protect retention with a schedule that adapts
            when life happens.
          </p>
        </div>

        <div className="grid gap-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Product
          </p>
          <PublicAuthLink
            signedInHref="/today"
            signedOutHref="/login"
            className="font-semibold text-[color:var(--kw-ink)] hover:underline"
          >
            Welcome
          </PublicAuthLink>
          <TrackedLink href="/pricing" telemetryName="footer.pricing" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Pricing
          </TrackedLink>
          <PublicAuthLink
            signedInHref="/today"
            signedOutHref="/welcome"
            className="font-semibold text-[color:var(--kw-ink)] hover:underline"
          >
            App
          </PublicAuthLink>
        </div>

        <div className="grid gap-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Legal
          </p>
          <TrackedLink href="/legal/terms" telemetryName="footer.terms" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Terms of Service
          </TrackedLink>
          <TrackedLink href="/legal/privacy" telemetryName="footer.privacy" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Privacy
          </TrackedLink>
          <TrackedLink href="/legal/refund-policy" telemetryName="footer.refund-policy" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Refund policy
          </TrackedLink>
          <TrackedLink href="/legal/sources" telemetryName="footer.sources" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Sources
          </TrackedLink>
          <p className="text-xs text-[color:var(--kw-faint)]">
            Copyright {new Date().getFullYear()} Hifzer
          </p>
        </div>
      </div>
    </footer>
  );
}
