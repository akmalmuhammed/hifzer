"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { HifzerMark } from "@/components/brand/hifzer-mark";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/legal", label: "Legal" },
  { href: "/legal/sources", label: "Sources" },
] as const;

export function MarketingNav(props: { authEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = usePublicAuth();
  const showSignedIn = props.authEnabled && isSignedIn;

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-[color:var(--kw-border-2)] bg-white/55 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--kw-ink)] text-white shadow-[var(--kw-shadow-soft)]">
              <HifzerMark />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Hifzer
              </span>
              <span className="block text-xs text-[color:var(--kw-muted)]">
                A calm hifz system
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-semibold text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {showSignedIn ? (
              <>
                <p className="px-2 text-xs font-semibold text-[color:var(--kw-muted)]">Welcome back</p>
                <Link href="/today">
                  <Button size="md">Open app</Button>
                </Link>
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 shadow-[var(--kw-shadow-soft)]">
                  <UserButton afterSignOutUrl="/welcome" />
                </div>
              </>
            ) : (
              <>
                <PublicAuthLink
                  signedInHref="/today"
                  signedOutHref="/login"
                  className="rounded-2xl px-3 py-2 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-black/[0.04] hover:text-[color:var(--kw-ink)]"
                >
                  Sign in
                </PublicAuthLink>
                <PublicAuthLink signedInHref="/today" signedOutHref="/login">
                  <Button size="md">Get started</Button>
                </PublicAuthLink>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="border-b border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-[1200px] space-y-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] hover:bg-black/[0.04]"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-1">
              {showSignedIn ? (
                <>
                  <Link
                    href="/today"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-2xl border border-[color:var(--kw-border)] bg-white/70 px-3 py-2 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                  >
                    Open app
                  </Link>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 shadow-[var(--kw-shadow-soft)]">
                    <UserButton afterSignOutUrl="/welcome" />
                  </div>
                </>
              ) : (
                <>
                  <PublicAuthLink
                    signedInHref="/today"
                    signedOutHref="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-2xl border border-[color:var(--kw-border)] bg-white/70 px-3 py-2 text-center text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                  >
                    Sign in
                  </PublicAuthLink>
                  <PublicAuthLink signedInHref="/today" signedOutHref="/login" onClick={() => setOpen(false)} className="flex-1">
                    <Button className="w-full">Get started</Button>
                  </PublicAuthLink>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
