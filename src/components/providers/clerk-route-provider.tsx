import { ClerkProvider } from "@clerk/nextjs";
import { clerkAuthRoutes } from "@/lib/auth-redirects";
import { clerkEnabled } from "@/lib/clerk-config";

export function ClerkRouteProvider({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled()) return children;

  return (
    <ClerkProvider
      signInUrl={clerkAuthRoutes.signInUrl}
      signUpUrl={clerkAuthRoutes.signUpUrl}
      signInForceRedirectUrl={clerkAuthRoutes.signInForceRedirectUrl}
      signInFallbackRedirectUrl={clerkAuthRoutes.signInFallbackRedirectUrl}
      signUpForceRedirectUrl={clerkAuthRoutes.signUpForceRedirectUrl}
      signUpFallbackRedirectUrl={clerkAuthRoutes.signUpFallbackRedirectUrl}
      appearance={{
        variables: {
          colorPrimary: "#05675b",
          colorText: "#1d1d1f",
          colorTextSecondary: "#58585d",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          borderRadius: "12px",
          fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", Inter, \"Helvetica Neue\", Arial, sans-serif",
        },
      }}
      localization={{
        signIn: {
          start: {
            title: "Sign in to Hifzer",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
