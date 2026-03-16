import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

export function MarketingFooter() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";
  const featureRequestHref = `mailto:${supportEmail}?subject=Hifzer+feature+request`;

  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className={`${styles.footerFrame} px-5 py-8 sm:px-6 md:px-8`}>
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[color:var(--kw-surface)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]">
                  <HifzerMark />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</p>
                  <p className="text-xs text-[color:var(--kw-muted)]">
                    Built by Muslims, for Muslims - and kept free to use at the core.
                  </p>
                </div>
              </div>

              <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--kw-muted)]">
                Your tool. Your practice. Your relationship with Allah. We just build and maintain
                the space with care, keep the core experience free to use, and stay open to what the
                community actually needs next.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="brand">Core app free to use</Pill>
                <Pill tone="accent">Open roadmap</Pill>
                <Pill tone="warn">Quiet by design</Pill>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                Explore
              </p>
              <TrackedLink
                href="/#features"
                telemetryName="footer.features"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Features
              </TrackedLink>
              <TrackedLink
                href="/#stories"
                telemetryName="footer.stories"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Stories
              </TrackedLink>
              <TrackedLink
                href="/#how-it-works"
                telemetryName="footer.how-it-works"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                How it works
              </TrackedLink>
              <TrackedLink
                href="/quran-preview"
                telemetryName="footer.quran-preview"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Qur&apos;an preview
              </TrackedLink>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                Build With Us
              </p>
              <TrackedLink
                href="/#community"
                telemetryName="footer.community"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Community
              </TrackedLink>
              <TrackedLink
                href="/#roadmap"
                telemetryName="footer.roadmap"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Roadmap
              </TrackedLink>
              <a href={featureRequestHref} className="font-semibold text-[color:var(--kw-ink)] hover:underline">
                Request a feature
              </a>
              <PublicAuthLink
                signedInHref="/today"
                signedOutHref="/signup"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Create my free space
              </PublicAuthLink>
              <TrackedLink
                href="/compare"
                telemetryName="footer.compare"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Compare
              </TrackedLink>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                Trust
              </p>
              <TrackedLink
                href="/legal/sources"
                telemetryName="footer.sources"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Sources
              </TrackedLink>
              <TrackedLink
                href="/legal/terms"
                telemetryName="footer.terms"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Terms of Service
              </TrackedLink>
              <TrackedLink
                href="/legal/privacy"
                telemetryName="footer.privacy"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Privacy
              </TrackedLink>
              <TrackedLink
                href="/legal/refund-policy"
                telemetryName="footer.refund-policy"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Refund policy
              </TrackedLink>
              <p className="pt-2 text-xs text-[color:var(--kw-faint)]">
                © {new Date().getFullYear()} Hifzer. Your tool. Your practice. Your relationship
                with Allah. We just maintain the space - free to use at the core.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
