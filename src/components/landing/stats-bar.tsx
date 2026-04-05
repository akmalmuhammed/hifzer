import styles from "./landing.module.css";

const STATS = [
  {
    value: "$0",
    label: "Core app to use",
    detail: "No subscription required for the main experience.",
  },
  {
    value: "1-time",
    label: "Optional support",
    detail: "If Hifzer helps you, support is one-time and never required.",
  },
  {
    value: "Qur'an + Hifz + Dua",
    label: "Distinct lanes",
    detail: "Reading, memorization, and dua keep their own space.",
  },
  {
    value: "Open roadmap",
    label: "Always growing",
    detail: "New tools are shaped in public from real requests.",
  },
] as const;

export function StatsBar() {
  return (
    <section className="py-5 md:py-6" aria-label="Hifzer highlights">
      <div className={styles.statsStrip}>
        {STATS.map((item) => (
          <div key={item.label} className={styles.statCard}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              {item.label}
            </p>
            <p className="mt-3 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)] md:text-2xl">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
