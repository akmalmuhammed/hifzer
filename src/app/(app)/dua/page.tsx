import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CircleAlert,
  ExternalLink,
  Heart,
  ListChecks,
  MoonStar,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { laylatAlQadrGuide } from "@/hifzer/ramadan/laylat-al-qadr";

export const metadata = {
  title: "Dua",
};

export default function DuaPage() {
  const guide = laylatAlQadrGuide;

  return (
    <div className="space-y-6 pb-12 pt-10 md:pb-16 md:pt-14">
      <PageHeader
        eyebrow="Dua"
        title="Laylat al-Qadr"
        subtitle="A structured Ramadan guide for forgiveness, authentic dua, and what is actually verified from the Sunnah for the last ten nights."
        right={(
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" className="gap-2">
              <a href={guide.featuredDua.source.href} target="_blank" rel="noreferrer">
                Source hadith <ExternalLink size={16} />
              </a>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/quran">
                Back to Qur&apos;an <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        )}
      />

      <Card className="relative overflow-hidden border border-[rgba(194,65,12,0.18)] bg-[linear-gradient(135deg,rgba(255,252,248,0.96),rgba(249,245,241,0.94))]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[rgba(194,65,12,0.12)] blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-[rgba(var(--kw-accent-rgb),0.10)] blur-2xl" />
        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Laylat al-Qadr</Pill>
              <Pill tone="success">Forgiveness</Pill>
              <Pill tone="neutral">Authentic guidance</Pill>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
                {guide.hero.eyebrow}
              </p>
              <h1 className="kw-marketing-display mt-3 max-w-[14ch] text-balance text-4xl leading-[0.95] text-[color:var(--kw-ink)] sm:text-5xl">
                {guide.hero.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                {guide.hero.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-2">
                <a href={guide.featuredDua.source.href} target="_blank" rel="noreferrer">
                  Read the hadith <ExternalLink size={15} />
                </a>
              </Button>
              <Button asChild variant="secondary" className="gap-2">
                <Link href="/ramadan">
                  Open Ramadan plan <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[22px] border border-[rgba(194,65,12,0.12)] bg-white/85 p-5 shadow-[var(--kw-shadow-soft)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
                  Verified anchors
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  What to build the night around
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[rgba(var(--kw-accent-rgb),1)]">
                <MoonStar size={16} />
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)]">
                  <CalendarDays size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Last ten nights</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">Seek it across the last ten, especially the odd nights.</p>
                </div>
              </div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <ShieldCheck size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Qiyam and presence</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">Stand the night in prayer with faith and hope for reward.</p>
                </div>
              </div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(194,65,12,0.18)] bg-[rgba(194,65,12,0.10)] text-[color:var(--kw-ember-600)]">
                  <Heart size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Forgiveness dua</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">Keep the taught dua for pardon and mercy central all night.</p>
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-[18px] border border-[rgba(194,65,12,0.16)] bg-[rgba(194,65,12,0.06)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">Boundary</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
                Hifzer&apos;s step-by-step plan is structured from authentic reports. It is not presented as a fixed prophetic ritual sequence.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Featured dua</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{guide.featuredDua.title}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
                If you remember one supplication for Laylat al-Qadr, make it this one.
              </p>
            </div>
            <Pill tone="success">Forgiveness</Pill>
          </div>

          <div className="mt-5 rounded-[22px] border border-[rgba(var(--kw-accent-rgb),0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,248,252,0.86))] p-5">
            <p dir="rtl" className="font-[family-name:var(--font-kw-quran)] text-[clamp(1.95rem,4vw,2.5rem)] leading-[2.05] text-[color:var(--kw-ink)]">
              {guide.featuredDua.arabic}
            </p>
            <p className="mt-4 text-base leading-7 text-[color:var(--kw-ink-2)]">{guide.featuredDua.transliteration}</p>
            <p className="mt-3 text-base leading-8 text-[color:var(--kw-muted)]">{guide.featuredDua.translation}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Pill tone="neutral">{guide.featuredDua.source.label}</Pill>
              <a href={guide.featuredDua.source.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                Open source <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </Card>

        <Card className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Qur&apos;an anchor</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{guide.quranAnchor.title}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{guide.quranAnchor.detail}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)]">
              <BookOpenText size={16} />
            </span>
          </div>

          <div className="mt-5 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
            <p className="text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">Better than a thousand months</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Let the scale of the night raise your effort. This page is designed to keep the focus on worship, forgiveness, and what is actually traceable to authentic reports.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="accent">Surah al-Qadr</Pill>
            <a href={guide.quranAnchor.source.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
              Read {guide.quranAnchor.source.label} <ExternalLink size={14} />
            </a>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {guide.verifiedAnchors.map((anchor) => (
          <Card key={anchor.title} className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Verified guidance</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{anchor.title}</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)]">
                <ShieldCheck size={15} />
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{anchor.detail}</p>
            <a href={anchor.source.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
              {anchor.source.label} <ExternalLink size={14} />
            </a>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Step by step</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">A structured night plan without inventing a formula</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                This sequence is Hifzer&apos;s product guidance, built from authenticated anchors. Use it as a calm plan, not as a claim that the Sunnah fixed these exact steps.
              </p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[rgba(var(--kw-accent-rgb),1)]">
              <ListChecks size={16} />
            </span>
          </div>

          <ol className="mt-6 grid gap-4">
            {guide.stepByStepPlan.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-t border-black/5 pt-4 first:border-t-0 first:pt-0">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.10)] font-[family-name:var(--font-kw-mono)] text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{step.detail}</p>
                  <p className="mt-2 text-xs leading-6 text-[color:var(--kw-faint)]">{step.anchor}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="grid gap-5">
          <Card className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Authenticity boundary</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{guide.authenticityBoundary.title}</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  Keep the distinction sharp: authentic worship anchors on one side, product structuring on the other.
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(194,65,12,0.18)] bg-[rgba(194,65,12,0.10)] text-[color:var(--kw-ember-600)]">
                <CircleAlert size={16} />
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {guide.authenticityBoundary.points.map((point) => (
                <div key={point} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-2xl border border-[rgba(194,65,12,0.18)] bg-[rgba(194,65,12,0.10)] text-[color:var(--kw-ember-600)]">
                    <CircleAlert size={14} />
                  </span>
                  <p className="text-sm leading-7 text-[color:var(--kw-muted)]">{point}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Sources</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">Primary references behind this page</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  Direct links for review. The product language here is intentionally narrower than popular Ramadan forwards.
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)]">
                <BookOpenText size={16} />
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {guide.sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 text-sm font-semibold text-[color:var(--kw-ink-2)] transition hover:border-[rgba(var(--kw-accent-rgb),0.18)] hover:bg-[rgba(var(--kw-accent-rgb),0.05)]"
                >
                  <span>{source.label}</span>
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
