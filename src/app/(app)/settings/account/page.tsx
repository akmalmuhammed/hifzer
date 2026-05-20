import { UserRound } from "lucide-react";
import { SettingsDetailHeader } from "@/components/app/settings-detail-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { clerkEnabled } from "@/lib/clerk-config";
import { AccountSettingsClient } from "./account-client";

export const metadata = {
  title: "Account",
};

export default function AccountSettingsPage() {
  const enabled = clerkEnabled();

  return (
    <div className="space-y-6">
      <SettingsDetailHeader
        title="Account"
        subtitle="Profile and sign out."
      />
      {enabled ? (
        <AccountSettingsClient />
      ) : (
        <Card>
          <EmptyState
            title="Account settings are unavailable"
            message="Account controls are not available in this environment. Your reading preview can still be opened without signing in."
            icon={<UserRound size={18} />}
          />
        </Card>
      )}
    </div>
  );
}
