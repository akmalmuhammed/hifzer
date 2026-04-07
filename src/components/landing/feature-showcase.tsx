"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export interface FeatureShowcaseProps {
  eyebrow?: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}

const SCREEN = {
  top: "2.2%",
  left: "9.7%",
  right: "9.7%",
  bottom: "11.7%",
} as const;

export function MacbookFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "621 / 360" }}>
      <div
        className="absolute overflow-hidden rounded-[8px] bg-[linear-gradient(180deg,#eef7f4,#f8fafc)]"
        style={{ top: SCREEN.top, left: SCREEN.left, right: SCREEN.right, bottom: SCREEN.bottom, zIndex: 0 }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-contain object-top"
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 50vw, 540px"
        />
      </div>
      <Image
        src="/macbook-frame.png"
        alt=""
        fill
        className="pointer-events-none object-contain [z-index:1]"
        sizes="(max-width: 640px) 88vw, (max-width: 1024px) 50vw, 540px"
        aria-hidden
      />
    </div>
  );
}

export function FeatureShowcase({
  eyebrow,
  title,
  body,
  imageSrc,
  imageAlt,
  reverse = false,
}: FeatureShowcaseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="px-3 py-2 sm:px-4 md:px-6 md:py-3">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`overflow-hidden rounded-[28px] border border-[rgba(var(--kw-accent-rgb),0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.78))] shadow-[0_24px_72px_rgba(15,23,42,0.08)] ${
          reverse ? "md:flex md:flex-row-reverse" : "md:flex md:flex-row"
        }`}
      >
        <div className="flex flex-1 flex-col justify-center px-6 pb-6 pt-8 sm:px-8 sm:py-10 md:px-12 md:py-14 lg:px-16 lg:py-16">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-3 max-w-[14ch] text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2rem,3.8vw,3.4rem)] leading-[0.95] tracking-tight text-[color:var(--kw-ink)]">
            {title}
          </h3>
          <p className="mt-4 max-w-[54ch] text-sm leading-7 text-[color:var(--kw-muted)] md:text-[15px]">
            {body}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden px-5 pb-6 pt-2 sm:px-8 sm:pb-0 md:px-10 md:py-10">
          <div className="w-full max-w-[92vw] drop-shadow-[0_28px_70px_rgba(15,23,42,0.16)] sm:max-w-[480px] md:max-w-full">
            <MacbookFrame src={imageSrc} alt={imageAlt} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
