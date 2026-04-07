import { AppProviders } from "@/components/providers/app-providers";
import { CommandPalette } from "@/components/shell/command-palette";
import { DemoAuthProvider } from "@/demo/demo-auth";
import { DemoStoreProvider } from "@/demo/store";
import { TeamProvider } from "@/demo/team";
import { DEFAULT_UI_LANGUAGE } from "@/hifzer/i18n/ui-language";
import { DEFAULT_THEME_DOCUMENT_STATE } from "@/hifzer/theme/preferences";

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders
      initialUiLanguage={DEFAULT_UI_LANGUAGE}
      initialDistractionFree={false}
      initialThemeState={DEFAULT_THEME_DOCUMENT_STATE}
    >
      <DemoAuthProvider>
        <DemoStoreProvider>
          <TeamProvider>
            {children}
            <CommandPalette />
          </TeamProvider>
        </DemoStoreProvider>
      </DemoAuthProvider>
    </AppProviders>
  );
}
