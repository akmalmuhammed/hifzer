import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Forgot Password",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  // Clerk handles password reset through its built-in SignIn component.
  // When a user clicks "Forgot password?" on the /login page, Clerk
  // manages the entire reset flow inline. Redirect there directly.
  if (clerkEnabled()) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <Pill tone="neutral">Auth</Pill>
      <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)]">
        Reset your password.
      </h1>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Auth not configured</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Password reset is available when Clerk auth is configured.
              Set the required Clerk environment variables to enable it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/login">
                <Button variant="secondary" className="gap-2">
                  Back to login <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <Mail size={18} />
          </span>
        </div>
      </Card>
    </div>
  );
}
