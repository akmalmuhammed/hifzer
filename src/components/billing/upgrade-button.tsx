"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePaddle } from "@/components/billing/paddle-provider";

type CheckoutPayload = {
  priceId: string;
  customData?: Record<string, unknown>;
  successUrl?: string;
};

export function UpgradeButton(props: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const { configured, ready, openCheckout } = usePaddle();
  const { pushToast } = useToast();

  return (
    <Button
      className={props.className}
      loading={loading}
      disabled={!configured || !ready}
      onClick={async () => {
        if (!configured || !ready) {
          pushToast({
            tone: "warning",
            title: "Paddle is not ready",
            message: "Set Paddle environment values and reload this page.",
          });
          return;
        }

        setLoading(true);
        try {
          const res = await fetch("/api/paddle/checkout", { method: "POST" });
          const payload = (await res.json()) as CheckoutPayload & { error?: string };
          if (!res.ok) {
            throw new Error(payload.error || "Failed to create checkout.");
          }

          openCheckout({
            priceId: payload.priceId,
            customData: payload.customData,
            successUrl: payload.successUrl,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown checkout error.";
          pushToast({
            tone: "warning",
            title: "Checkout failed",
            message,
          });
        } finally {
          setLoading(false);
        }
      }}
    >
      Upgrade to Paid <ArrowUpRight size={16} />
    </Button>
  );
}

