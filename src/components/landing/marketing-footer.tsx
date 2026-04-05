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
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Hifzer</p>
              <p className="text-xs text-[color:var(--kw-muted)]">
                Your Islamic companion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
