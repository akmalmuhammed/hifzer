"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";

export function AccountSettingsClient() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <Card>
        <EmptyState
          title="Loading account"
          message="Fetching your profile from Clerk."
          icon={<UserRound size={18} />}
        />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <EmptyState
          title="Not signed in"
          message="Sign in to manage your account."
          icon={<UserRound size={18} />}
        />
      </Card>
    );
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? null;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Signed in</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            {primaryEmail ? (
              <>
                Email: <span className="font-semibold text-[color:var(--kw-ink)]">{primaryEmail}</span>
              </>
            ) : (
              <>Your email is not available.</>
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Pill tone="neutral">Auth: Clerk</Pill>
            <Pill tone="neutral">User: {user.id}</Pill>
          </div>
        </div>

        <div className="shrink-0">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </Card>
  );
}

