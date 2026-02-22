import { TrackedLink } from "@/components/telemetry/tracked-link";

type MotivationTile = {
  category: "Hifz" | "Qur'an" | "Progress";
  title: string;
  source: string;
};

const MOTIVATION_TILES: MotivationTile[] = [
  { category: "Qur'an", title: "Recite with presence. Every ayah reshapes the heart.", source: "Qur'an 13:28" },
  { category: "Hifz", title: "Small daily memorization beats rare intense sessions.", source: "Sahih al-Bukhari 6464" },
  { category: "Progress", title: "Consistency is your superpower. Protect the streak.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Allah opens doors for those who keep returning.", source: "Qur'an 65:2-3" },
  { category: "Hifz", title: "One clean page today becomes confidence tomorrow.", source: "Hifzer Method" },
  { category: "Progress", title: "You are never behind when you restart with sincerity.", source: "Qur'an 39:53" },
  { category: "Qur'an", title: "The best path forward begins with one recitation now.", source: "Qur'an 73:20" },
  { category: "Hifz", title: "Review is honor. Revision is how memorization survives.", source: "Sahih Muslim 791" },
  { category: "Progress", title: "Build momentum quietly. Let results speak later.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Light enters the heart through repeated remembrance.", source: "Qur'an 29:45" },
  { category: "Hifz", title: "Accuracy first, speed second, barakah always.", source: "Hifzer Method" },
  { category: "Progress", title: "A focused 20 minutes can transform your day.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Recite calmly. Depth grows where haste disappears.", source: "Qur'an 73:4" },
  { category: "Hifz", title: "Guard what you memorized before adding more.", source: "Sahih al-Bukhari 5033" },
  { category: "Progress", title: "Your future self will thank you for today's discipline.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "The Qur'an elevates those who carry it with care.", source: "Sahih Muslim 817" },
  { category: "Hifz", title: "Even one ayah reviewed sincerely is a real win.", source: "Hifzer Method" },
  { category: "Progress", title: "Do not chase perfection. Chase continuity.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Morning recitation sets the tone for the entire day.", source: "Qur'an 17:78" },
  { category: "Hifz", title: "Strong retention is built by returning before forgetting.", source: "Hifzer Method" },
  { category: "Progress", title: "You grow every time you choose the harder right action.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "With hardship comes ease. Keep going.", source: "Qur'an 94:5-6" },
  { category: "Hifz", title: "Memorize less, but memorize with excellence.", source: "Hifzer Method" },
  { category: "Progress", title: "Delayed comfort creates lasting strength.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "The reciter's rank rises with each verse.", source: "Sunan Abi Dawud 1464" },
  { category: "Hifz", title: "Your tongue repeats. Your heart records.", source: "Hifzer Method" },
  { category: "Progress", title: "Protect your rhythm and your rhythm will protect you.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Never underestimate one sincere return to Allah.", source: "Qur'an 2:186" },
  { category: "Hifz", title: "Review debt shrinks when you act early.", source: "Hifzer Method" },
  { category: "Progress", title: "The disciplined become unstoppable with time.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Make the Qur'an your daily meeting, not a someday goal.", source: "Qur'an 20:14" },
  { category: "Hifz", title: "Precision in tajweed is respect for revelation.", source: "Qur'an 73:4" },
  { category: "Progress", title: "Tiny wins compound into deep confidence.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Recite for Allah. Recognition is not the reward.", source: "Sahih Muslim 1905" },
  { category: "Hifz", title: "Your review list is a roadmap, not a burden.", source: "Hifzer Method" },
  { category: "Progress", title: "Winners show up when motivation is low.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Hearts soften when words of Allah are repeated.", source: "Qur'an 39:23" },
  { category: "Hifz", title: "The strongest hifz is the hifz you revisit daily.", source: "Hifzer Method" },
  { category: "Progress", title: "Train your habits and your habits will carry you.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Read with humility. Guidance follows humility.", source: "Qur'an 2:2" },
  { category: "Hifz", title: "Slow correction today prevents major gaps later.", source: "Hifzer Method" },
  { category: "Progress", title: "Stay patient. Growth is happening underneath.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Your recitation is seen, heard, and rewarded.", source: "Qur'an 99:7" },
  { category: "Hifz", title: "Daily return beats weekly panic.", source: "Hifzer Method" },
  { category: "Progress", title: "Commitment creates the life inspiration talks about.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Recite and ascend. Keep climbing by ayah.", source: "Jami at-Tirmidhi 2914" },
  { category: "Hifz", title: "Protect old pages so new pages can stay.", source: "Hifzer Method" },
  { category: "Progress", title: "Show up now. Your next level starts here.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "The Book is mercy. Hold it daily.", source: "Qur'an 10:57" },
  { category: "Hifz", title: "One session done with ihsan is never small.", source: "Sahih Muslim 1955" },
];

export const metadata = {
  title: "Motivation | Hifzer",
  description: "Motivational Hifz and Qur'an creatives.",
  alternates: {
    canonical: "/motivation",
  },
};

function tileBackgroundClass(index: number) {
  const variant = index % 5;

  if (variant === 0) return "bg-[linear-gradient(150deg,rgba(var(--kw-accent-rgb),0.12)_0%,rgba(255,255,255,0.9)_70%)]";
  if (variant === 1) return "bg-[linear-gradient(160deg,rgba(10,138,119,0.14)_0%,rgba(255,255,255,0.92)_72%)]";
  if (variant === 2) return "bg-[linear-gradient(145deg,rgba(11,18,32,0.06)_0%,rgba(255,255,255,0.96)_64%)]";
  if (variant === 3) return "bg-[linear-gradient(155deg,rgba(43,75,255,0.12)_0%,rgba(255,255,255,0.94)_74%)]";

  return "bg-[linear-gradient(160deg,rgba(6,74,66,0.12)_0%,rgba(255,255,255,0.94)_76%)]";
}

export default function MotivationPage() {
  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 text-center md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
            Motivation Grid
          </p>
          <h1 className="kw-marketing-display mt-2 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] md:text-5xl">
            50 Daily Creatives for Hifz, Qur&apos;an, and Progress
          </h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-border)] p-px shadow-[var(--kw-shadow-soft)]">
          <div className="grid gap-px bg-[color:var(--kw-border)] [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {MOTIVATION_TILES.map((tile, index) => (
              <article
                key={`${tile.title}-${index}`}
                className={`relative aspect-[9/16] overflow-hidden p-4 md:p-5 ${tileBackgroundClass(index)}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.5),transparent_45%),radial-gradient(circle_at_82%_88%,rgba(var(--kw-accent-rgb),0.12),transparent_40%)]" />
                <div className="relative flex h-full flex-col">
                  <p className="inline-flex w-fit rounded-full border border-[color:var(--kw-border)] bg-white/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-ink-2)]">
                    {tile.category}
                  </p>

                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <h2 className="text-balance text-[clamp(1.05rem,2.2vw,1.9rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-[color:var(--kw-ink)]">
                      {tile.title}
                    </h2>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                      {tile.source}
                    </p>
                  </div>

                  <p className="text-center text-[11px] font-semibold text-[color:var(--kw-teal-800)]">
                    Join Hifzer
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--kw-faint)]">
          <TrackedLink href="/" telemetryName="motivation.back-home" className="underline underline-offset-2">
            Back to home
          </TrackedLink>
        </p>
      </div>
    </section>
  );
}
