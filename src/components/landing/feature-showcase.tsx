"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export interface FeatureShowcaseProps {
  boldIntro: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  /** Apple Fitness+–style shrink-and-round as the card exits the top of the viewport */
  shrinkOnExit?: boolean;
}

// Exact screen area from pixel analysis of macbook-frame.png (621×360)
const SCREEN = {
  top: "2.2%",
  left: "9.7%",
  right: "9.7%",
  bottom: "11.7%",
} as const;

function MacbookFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "621 / 360" }}>
      <div
        className="absolute overflow-hidden"
        style={{ top: SCREEN.top, left: SCREEN.left, right: SCREEN.right, bottom: SCREEN.bottom, zIndex: 0 }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 50vw, 540px"
          loading="lazy"
        />
      </div>
      <Image
        src="/macbook-frame.png"
        alt=""
        fill
        className="pointer-events-none object-contain [z-index:1]"
        aria-hidden
      />
    </div>
  );
}

export function FeatureShowcase({
  boldIntro,
  body,
  imageSrc,
  imageAlt,
  reverse = false,
  shrinkOnExit = false,
}: FeatureShowcaseProps) {
  const reduceMotion = useReducedMotion();

  // Scroll tracking for the window-closing effect (only used when shrinkOnExit=true)
  const stickyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stickyRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.84]);
  const borderRadius = useTransform(scrollYProgress, [0, 1], [22, 48]);

  const cardStyle =
    shrinkOnExit && !reduceMotion ? { scale, borderRadius } : undefined;

  const card = (
    <motion.div
      style={cardStyle}
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`kw-feature-card overflow-hidden ${
        shrinkOnExit ? "" : "rounded-[22px] sm:rounded-[28px]"
      } ${reverse ? "md:flex md:flex-row-reverse" : "md:flex md:flex-row"}`}
    >
      {/* Text — always first in DOM so it's on top on mobile */}
      <div className="flex flex-1 flex-col justify-center px-6 pb-6 pt-8 sm:px-8 sm:py-10 md:px-12 md:py-16 lg:px-16 lg:py-20">
        <p className="text-[clamp(1rem,1.6vw,1.22rem)] leading-[1.8] text-[color:var(--kw-muted)]">
          <strong className="font-bold text-[color:var(--kw-ink)]">{boldIntro}</strong>{" "}
          {body}
        </p>
      </div>

      {/* MacBook — below text on mobile, side by side on desktop */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-5 pb-6 pt-2 sm:px-8 sm:pb-0 md:px-10 md:py-10">
        <div className="w-full max-w-[92vw] drop-shadow-xl sm:max-w-[480px] md:max-w-full">
          <MacbookFrame src={imageSrc} alt={imageAlt} />
        </div>
      </div>
    </motion.div>
  );

  if (shrinkOnExit) {
    return (
      // Tall wrapper gives scroll room; inner div is sticky so the card stays
      // pinned at the top while scrollYProgress drives the scale + radius transform.
      <div style={{ minHeight: "130vh" }} className="relative">
        <div
          ref={stickyRef}
          className="sticky top-0 px-3 py-2 sm:px-4 md:px-6 md:py-3"
        >
          {card}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 sm:px-4 md:px-6 md:py-3">
      {card}
    </div>
  );
}
