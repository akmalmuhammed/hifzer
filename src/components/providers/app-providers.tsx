"use client";

import { ToastProvider } from "@/components/ui/toast";
import { TelemetryProvider } from "@/components/providers/telemetry-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TelemetryProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </TelemetryProvider>
  );
}
