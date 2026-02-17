"use client";

import Script from "next/script";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type PaddleEnvironment = "sandbox" | "production";

type PaddleCheckoutInput = {
  priceId: string;
  customData?: Record<string, unknown>;
  successUrl?: string;
};

type PaddleContextValue = {
  configured: boolean;
  ready: boolean;
  openCheckout: (input: PaddleCheckoutInput) => void;
};

type PaddleJs = {
  Environment: {
    set: (env: PaddleEnvironment) => void;
  };
  Initialize: (options: Record<string, unknown>) => void;
  Update?: (options: Record<string, unknown>) => void;
  Checkout: {
    open: (options: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleJs;
    __hifzerPaddleInitialized?: boolean;
  }
}

const PaddleContext = createContext<PaddleContextValue | undefined>(undefined);

const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() ?? "";
const publicEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT?.trim().toLowerCase() === "production"
  ? "production"
  : "sandbox";

export function PaddleProvider(props: {
  children: React.ReactNode;
  customerEmail?: string | null;
  paddleCustomerId?: string | null;
}) {
  const configured = clientToken.length > 0;
  const [ready, setReady] = useState(false);

  const initialize = useCallback(() => {
    if (!configured || typeof window === "undefined" || !window.Paddle) {
      return;
    }

    if (publicEnvironment === "sandbox") {
      window.Paddle.Environment.set("sandbox");
    }

    if (window.__hifzerPaddleInitialized) {
      if (props.paddleCustomerId && window.Paddle.Update) {
        window.Paddle.Update({ pwCustomer: { id: props.paddleCustomerId } });
      }
      setReady(true);
      return;
    }

    const initOptions: Record<string, unknown> = { token: clientToken };
    if (props.paddleCustomerId) {
      initOptions.pwCustomer = { id: props.paddleCustomerId };
    }

    window.Paddle.Initialize(initOptions);
    window.__hifzerPaddleInitialized = true;
    setReady(true);
  }, [configured, props.paddleCustomerId]);

  const openCheckout = useCallback(
    (input: PaddleCheckoutInput) => {
      if (!configured || typeof window === "undefined" || !window.Paddle) {
        throw new Error("Paddle checkout is not configured.");
      }

      const checkoutOptions: Record<string, unknown> = {
        items: [{ priceId: input.priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          successUrl: input.successUrl ?? `${window.location.origin}/billing/success`,
        },
      };

      if (props.customerEmail) {
        checkoutOptions.customer = { email: props.customerEmail };
      }
      if (input.customData) {
        checkoutOptions.customData = input.customData;
      }

      window.Paddle.Checkout.open(checkoutOptions);
    },
    [configured, props.customerEmail],
  );

  const value = useMemo<PaddleContextValue>(
    () => ({ configured, ready, openCheckout }),
    [configured, openCheckout, ready],
  );

  return (
    <PaddleContext.Provider value={value}>
      {configured ? (
        <Script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          strategy="afterInteractive"
          onLoad={initialize}
          onReady={initialize}
        />
      ) : null}
      {props.children}
    </PaddleContext.Provider>
  );
}

export function usePaddle() {
  const ctx = useContext(PaddleContext);
  if (!ctx) {
    throw new Error("usePaddle must be used within PaddleProvider.");
  }
  return ctx;
}
