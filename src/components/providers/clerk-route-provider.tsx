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
