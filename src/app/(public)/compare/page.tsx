import type { Metadata } from "next";
import { ComparisonMatrix } from "@/components/landing/comparison-matrix";
import { Pill } from "@/components/ui/pill";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "See how Hifzer compares with teacher-only routines and generic flashcards for long-term Qur'an retention.",
  alternates: {
    canonical: "/compare",
  },
};

export default function ComparePage() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-[1.4rem] pb-24 pt-14 text-center md:pb-32 md:pt-24">
      <Pill tone="neutral">Compare</Pill>
      <h1 className="mx-auto mt-5 max-w-[56rem] text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.6rem,5.8vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[color:var(--kw-ink)]">
        Built for retention, not streaks.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-[clamp(1.1rem,1.6vw,1.3rem)] leading-[1.42] tracking-[-0.014em] text-[color:var(--kw-muted)]">
        Most tools track activity. Hifzer protects the loop: read with trusted sources, review what may fade,
        save what matters, and return tomorrow without starting over.
      </p>
      <ComparisonMatrix />
    </div>
  );
}
