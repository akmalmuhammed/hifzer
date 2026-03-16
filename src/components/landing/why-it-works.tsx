import { ArrowRight } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import styles from "./landing.module.css";

const PERSONAS = [
  {
    title: "I start strong every Ramadan, then quietly disappear.",
    copy: "We build for the restart, not only for the ideal week.",
  },
  {
    title: "I am a busy parent trying to find five quiet minutes after everyone sleeps.",
    copy: "Five sincere minutes still matter when the next step is clear.",
  },
  {
    title: "I embraced Islam and still feel behind on basics everyone else seems to know.",
    copy: "You can begin from zero without embarrassment or hidden assumptions.",
  },
  {
    title: "I want Hifz, but I feel too late to begin seriously.",
    copy: "Gentle progress still counts when intention is alive.",
  },
  {
    title: "I pray, but I want more presence, not just task completion.",
    copy: "Reading, dua, and listening stay close when you need depth more than noise.",
  },
  {
    title: "I used to be consistent. I feel ashamed to come back now.",
    copy: "The door back should feel open, not punishing.",
  },
] as const;

export function WhyItWorks() {
  return (
    <section id="personas" className="py-10 md:py-14">
      <Card className={`${styles.sectionShell} px-5 py-6 sm:px-6 sm:py-7`}>
        <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              Who this is for
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              If you&apos;ve ever felt this, you&apos;re in the right place.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-8 text-[color:var(--kw-muted)]">
              Hifzer is not for perfect Muslims. It is for Muslims who are trying to come back, stay
              steady, and build a life that sounds more like Qur&apos;an than like delay.
            </p>

            <div className="mt-7 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                Built around honest struggles, not idealized routines.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                The point is not to look devout inside the app. The point is to make return and
                consistency easier in real life.
              </p>
            </div>
          </div>

          <div className={styles.personaGrid}>
            {PERSONAS.map((item) => (
              <div key={item.title} className={styles.personaCard}>
                <p className="text-base font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
              Begin where you are, with what you have.
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Your return does not need to look dramatic to be sincere.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
              Begin today <ArrowRight size={16} />
            </PublicAuthLink>
          </Button>
        </div>
      </Card>
    </section>
  );
}
