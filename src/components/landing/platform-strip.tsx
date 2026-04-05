import { Globe, Smartphone, Monitor } from "lucide-react";

const PLATFORMS = [
  {
    icon: Smartphone,
    label: "iPhone",
    sub: "Open in Safari, tap Share, Add to Home Screen",
  },
  {
    icon: Smartphone,
    label: "Android",
    sub: "Open in Chrome, tap the menu, Install app",
  },
  {
    icon: Monitor,
    label: "Any browser",
    sub: "No install needed. Just open and start",
  },
];

export function PlatformStrip() {
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <div className="text-center">
          <h2 className="kw-marketing-display text-2xl text-[color:var(--kw-ink)] sm:text-3xl">
            Works everywhere you are.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--kw-muted)]">
            No App Store. No waiting. Install in seconds from your browser on any device.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLATFORMS.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-start gap-4 rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/60 px-5 py-5 backdrop-blur-sm sm:flex-col sm:items-center sm:text-center"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-accent)]">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-bold text-[color:var(--kw-ink)]">{label}</p>
                <p className="mt-0.5 text-xs leading-5 text-[color:var(--kw-muted)]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
