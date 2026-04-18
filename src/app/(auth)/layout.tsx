import { cookies } from "next/headers";
import { AppProviders } from "@/components/providers/app-providers";
import { resolveInitialThemeState, resolveInitialUiLanguage } from "@/lib/layout-preferences";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  return (
    <AppProviders
      initialUiLanguage={resolveInitialUiLanguage(cookieStore)}
      initialDistractionFree={false}
      initialThemeState={resolveInitialThemeState(cookieStore)}
    >
      <main id="main-content" className="mx-auto w-full max-w-[520px] px-4 py-12">
        {children}
      </main>
    </AppProviders>
  );
}
