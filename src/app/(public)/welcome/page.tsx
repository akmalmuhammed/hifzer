import { Card } from "@/components/ui/card";
import { WelcomeAuthCta } from "@/components/landing/welcome-auth-cta";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Welcome",
  alternates: {
    canonical: "/welcome",
  },
};

export default function WelcomePage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="brand">Welcome</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        A smarter way to keep your hifz.
        <span className="block text-[rgba(31,54,217,1)]">Daily plan. Clear feedback.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Hifzer is built around consistency and retention. You choose your starting point, we build a
        plan that respects your time, and your reviews adapt when life happens.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <WelcomeAuthCta />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            k: "Sabaq, Sabqi, Manzil",
            v: "A simple rhythm: new, recent review, long review.",
          },
          {
            k: "Per-ayah grading",
            v: "Again, Hard, Good, Easy becomes durable scheduling data.",
          },
          {
            k: "Audio-first",
            v: "Every ayah has an audio player with repeat and speed controls.",
          },
        ].map((row) => (
          <Card key={row.k}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              {row.k}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{row.v}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
