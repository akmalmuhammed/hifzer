import clsx from "clsx";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/g);
  const first = parts[0]?.[0] ?? "K";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const GRADIENTS: Array<[string, string]> = [
  ["var(--kw-teal-700)", "var(--kw-cobalt-600)"],
  ["var(--kw-cobalt-600)", "var(--kw-ember-500)"],
  ["var(--kw-ember-500)", "var(--kw-teal-600)"],
  ["var(--kw-sky-600)", "var(--kw-cobalt-600)"],
  ["var(--kw-rose-600)", "var(--kw-ember-500)"],
  ["var(--kw-lime-600)", "var(--kw-teal-600)"],
];

export function Avatar(props: {
  name: string;
  seed?: string;
  size?: number;
  className?: string;
}) {
  const size = props.size ?? 40;
  const seed = (props.seed ?? props.name).trim() || "kitewave";
  const pick = GRADIENTS[hash(seed) % GRADIENTS.length]!;
  const [a] = pick;

  return (
    <div
      className={clsx(
        "grid shrink-0 place-items-center rounded-full",
        "text-white",
        props.className,
      )}
      style={{
        width: size,
        height: size,
        background: a,
      }}
      aria-label={props.name}
      title={props.name}
    >
      <span className="text-xs font-semibold tracking-[-0.01em]">{initials(props.name)}</span>
    </div>
  );
}

