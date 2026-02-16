import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignUp } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Signup",
};

export default function SignupPage() {
  const configured = clerkEnabled();

  return (
    <div className="space-y-6">
      <Pill tone="neutral">Auth</Pill>
      <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)]">
        Create your account.
        <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Start with any surah.</span>
      </h1>

      <Card>
        {!configured ? (
          <>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Clerk not configured</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              This page will render Clerk&apos;s sign-up UI once configured.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/login">
                <Button variant="secondary" className="gap-2">
                  Go to login <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/welcome">
                <Button variant="secondary" className="gap-2">
                  Back to welcome <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid place-items-center py-6">
            <SignUp />
          </div>
        )}
      </Card>

      <p className="text-sm text-[color:var(--kw-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
