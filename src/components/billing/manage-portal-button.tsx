"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type PortalPayload = {
  portalUrl?: string;
  error?: string;
};

export function ManagePortalButton(props: { className?: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToast();

  return (
    <Button
      variant="secondary"
      className={props.className}
      loading={loading}
      disabled={props.disabled}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/paddle/portal", { method: "POST" });
          const payload = (await res.json()) as PortalPayload;
          if (!res.ok || !payload.portalUrl) {
            throw new Error(payload.error || "Billing portal is unavailable.");
          }
          window.location.assign(payload.portalUrl);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown portal error.";
          pushToast({
            tone: "warning",
            title: "Portal failed",
            message,
          });
        } finally {
          setLoading(false);
        }
      }}
    >
      Open billing portal <ExternalLink size={16} />
    </Button>
  );
}

