import Link from "next/link";
import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[color:var(--kw-border-2)] bg-white/40 backdrop-blur">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--kw-ink)] text-white shadow-[var(--kw-shadow-soft)]">
              <HifzerMark />
            </span>
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</p>
              <p className="text-xs text-[color:var(--kw-muted)]">
                A calm hifz system.
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
          <Link href="/pricing" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Pricing
          </Link>
          <PublicAuthLink
            signedInHref="/today"
            signedOutHref="/login"
            className="font-semibold text-[color:var(--kw-ink)] hover:underline"
          >
            App
          </PublicAuthLink>
        </div>

        <div className="grid gap-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Legal
          </p>
          <Link href="/legal/terms" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Terms
          </Link>
          <Link href="/legal/privacy" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Privacy
          </Link>
          <Link href="/legal/refund-policy" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Refund policy
          </Link>
          <Link href="/legal/sources" className="font-semibold text-[color:var(--kw-ink)] hover:underline">
            Sources
          </Link>
          <p className="text-xs text-[color:var(--kw-faint)]">
            Copyright {new Date().getFullYear()} Hifzer
          </p>
        </div>
      </div>
    </footer>
  );
}
