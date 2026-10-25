"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./landing.module.css";

type RevealState = "ssr" | "hidden" | "shown";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fades a block in as it scrolls into view. The server render is fully visible,
 * so there is no flash and no hidden content without JavaScript. Blocks that
 * are already on screen at load, and every block under reduced motion, are
 * never hidden at all.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("ssr");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion() || node.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setState("shown");
      return;
    }
    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <div
      ref={ref}
      style={style}
      className={clsx(
        className,
        state === "hidden" && styles.revealHidden,
        state === "shown" && styles.revealShown,
      )}
    >
      {children}
    </div>
  );
}

/** Counts a number up from zero the first time it is seen. Final value is the server render. */
export function CountUp({
  to,
  suffix = "%",
  duration = 1400,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    setValue(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return (
    <span ref={ref}>
      <span className="sr-only">
        {to}
        {suffix}
      </span>
      <span aria-hidden>
        {value}
        {suffix}
      </span>
    </span>
  );
}
