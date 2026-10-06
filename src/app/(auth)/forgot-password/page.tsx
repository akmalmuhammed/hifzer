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
    <div className="space-y-7 text-center">
      <Pill tone="neutral">Auth</Pill>
      <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.2rem,6vw,3rem)] font-semibold leading-[1.07] tracking-[-0.03em] text-[color:var(--kw-ink)]">
        Reset your password.
      </h1>

      <Card className="p-7! shadow-none!">
        <div className="flex flex-col-reverse items-center gap-5">
          <div>
            <p className="text-[1.15rem] font-semibold tracking-[-0.018em] text-[color:var(--kw-ink)]">Auth not configured</p>
            <p className="mt-2 text-[0.98rem] leading-[1.5] text-[color:var(--kw-muted)]">
              Password reset is available when Clerk auth is configured.
              Set the required Clerk environment variables to enable it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link href="/login">
                <Button variant="secondary" className="gap-2">
                  Back to login <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-muted)] [&_svg]:h-6 [&_svg]:w-6">
            <Mail size={18} />
          </span>
        </div>
      </Card>
    </div>
  );
}
