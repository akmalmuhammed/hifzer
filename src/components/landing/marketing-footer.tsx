import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Pill } from "@/components/ui/pill";
import styles from "./landing-home.module.css";

export function MarketingFooter() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";
  const featureRequestHref = `mailto:${supportEmail}?subject=Hifzer+feature+request`;

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
                    A quieter Qur&apos;an companion.
                  </p>
                </div>
              </div>

              <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--kw-muted)]">
                A calm space for reading, hifz, dua, and private reflection. Start in the browser,
                and sign in when you want your place and progress saved to your account.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="brand">Core app free</Pill>
                <Pill tone="accent">Saved to your account</Pill>
                <Pill tone="warn">Quiet by design</Pill>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                Start
              </p>
              <TrackedLink
                href="/quran-preview"
                telemetryName="footer.preview"
                className="font-semibold text-[color:var(--kw-ink)] hover:underline"
              >
                Preview the reader
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
                (c) {new Date().getFullYear()} Hifzer. Calm, honest tools for reading, hifz, and dua.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
