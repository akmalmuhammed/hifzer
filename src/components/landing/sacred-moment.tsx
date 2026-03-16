import styles from "./landing.module.css";

export function SacredMoment() {
  return (
    <section className="py-10 md:py-14" aria-label="Sacred moment">
      <div className={`${styles.sacredShell} px-5 py-10 sm:px-6 md:px-8 md:py-14`}>
        <div className="mx-auto max-w-[860px] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
            Sacred moment
          </p>
          <p
            dir="rtl"
            className="mt-8 text-balance text-[clamp(2.1rem,6.8vw,4.4rem)] leading-[1.8] text-[color:var(--kw-ink)] [font-family:var(--font-kw-quran)]"
          >
            وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ
          </p>
          <p className="mt-6 text-balance text-lg leading-8 text-[color:var(--kw-ink-2)] sm:text-xl">
            &ldquo;And when My servants ask you concerning Me - indeed, I am near.&rdquo;
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
            Qur&apos;an 2:186
          </p>
        </div>
      </div>
    </section>
  );
}
