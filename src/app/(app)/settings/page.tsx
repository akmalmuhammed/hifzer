import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import { getUiLanguageServer } from "@/hifzer/i18n/server";
import { SettingsHub } from "./settings-hub";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const language = await getUiLanguageServer();
  const copy = getAppUiCopy(language);

  return (
    <SettingsHub
      eyebrow={copy.settingsPage.eyebrow}
      title={copy.settingsPage.title}
      subtitle="Manage your preferences."
      languageTitle={copy.languageSettings.title}
      languageDesc="Interface and translation."
    />
  );
}
