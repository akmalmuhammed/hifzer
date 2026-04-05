import { ArrowRight } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";

const ROADMAP_ITEMS = [
  {
    title: "Mushabihat radar and seam trainer",
    detail: "Catch similar ayah confusion earlier and turn weak transitions into focused drills.",
    status: "Planned",
  },
  {
    title: "Rescue sessions and confidence heatmap",
    detail: "Short repair sessions and clearer visibility into where memorization is getting fragile.",
    status: "Planned",
  },
  {
    title: "Imam prep and Hifz-to-salah builder",
    detail: "Help stable passages become prayer-ready sets without losing structure.",
    status: "Planned",
  },
  {
    title: "Native iOS app",
    detail: "A focused daily workflow with stronger install feel, sync, and offline-friendly loops.",
    status: "Planned",
  },
  {
    title: "Native Android app",
    detail: "Parity with iOS core loops and lighter background sync for lower-connectivity use.",
    status: "Planned",
  },
  {
    title: "Scalable delivery foundation",
    detail: "Better performance, better caching, and stronger reliability for the routines people depend on.",
    status: "In progress",
  },
] as const;

export function CommunityRoadmap() {
  const featureRequestHref = `mailto:${SUPPORT_EMAIL}?subject=Hifzer+feature+request`;

  return (
    <section id="community" className="py-10 md:py-14">
      <Card className={`${styles.sectionShell} px-5 py-6 sm:px-6 sm:py-7`}>
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              Community and roadmap
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              You are not just opening a tool. You are shaping what comes next.
            </h2>
            <p className="mt-4 max-w-[60ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              Hifzer grows because real people say, &quot;I need this.&quot; The roadmap stays open so
              the next layer of the product can be shaped by worship needs, not vanity metrics.
            </p>

            <div className="mt-6 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                Have an idea? Ask for it directly.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Feature requests and product feedback can go straight to the team by email. No extra
                account or community platform is required first.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <PublicAuthLink signedInHref="/roadmap" signedOutHref="/signup">
                  View full roadmap <ArrowRight size={16} />
                </PublicAuthLink>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={featureRequestHref}>Request a feature</a>
              </Button>
            </div>
          </div>

          <div id="roadmap" className={styles.storyGrid}>
            {ROADMAP_ITEMS.map((item) => (
              <div key={item.title} className={styles.storyCard}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Pill tone={item.status === "In progress" ? "accent" : "neutral"}>{item.status}</Pill>
                  <Pill tone="brand">Roadmap</Pill>
                </div>
                <p className="mt-4 text-base font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
