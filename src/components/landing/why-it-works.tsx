import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import styles from "./landing.module.css";

const PERSONAS = [
  {
    title: "The Inconsistent",
    quote: "You start strong every Ramadan. By Shawwal, you've disappeared. You hate yourself for it, but you can't seem to change.",
    response: "Build your own system. Use only the pieces that fit your life.",
  },
  {
    title: "The Busy Parent",
    quote: "Between work and kids, your Qur'an time is whatever is left at 11pm when you are already exhausted.",
    response: "Five minutes is enough. Make the tool work around your schedule.",
  },
  {
    title: "The Revert / Convert",
    quote: "You embraced Islam but do not know where to start. Everyone assumes you know basics you never learned.",
    response: "Start anywhere. Explore freely. There is no wrong door in.",
  },
  {
    title: "The Aspiring Hafiz",
    quote: "You have wanted to memorize for years. It feels impossible. You are not young anymore.",
    response: "Your pace is the right pace when the intention is still alive.",
  },
  {
    title: "The Seeker",
    quote: "You pray and fast, but something still feels missing. You want connection, not just compliance.",
    response: "Dig deeper. Keep reading, dua, and reflection closer together.",
  },
  {
    title: "The One Who Left",
    quote: "You used to be consistent. Life happened. You are embarrassed to come back after so long.",
    response: "The door is still open. Your space can still be here exactly as you need it.",
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
              Hifzer is for the Muslim trying to come back, keep showing up, and build a routine
              that feels more faithful than performative.
            </p>
          </div>

          <div className={styles.personaGrid}>
            {PERSONAS.map((item) => (
              <div key={item.title} className={styles.personaCard}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                  {item.title}
                </p>
                <p className="mt-4 text-base font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">{item.response}</p>
                <div className="mt-5">
                  <Button asChild size="md" variant="secondary">
                    <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                      This is me
                    </PublicAuthLink>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
