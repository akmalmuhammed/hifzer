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
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Compare</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Built for retention, not streaks.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Most tools track activity. Hifzer protects the loop: read with trusted sources, review what may fade,
        save what matters, and return tomorrow without starting over.
      </p>
      <ComparisonMatrix />
    </div>
  );
}
