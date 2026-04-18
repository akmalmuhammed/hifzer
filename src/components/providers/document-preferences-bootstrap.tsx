import {
  DEFAULT_UI_LANGUAGE,
  isUiLanguageRtl,
  UI_LANGUAGE_COOKIE,
  uiLanguageToHtmlLang,
} from "@/hifzer/i18n/ui-language";
import {
  DEFAULT_THEME_DOCUMENT_STATE,
  THEME_ACCENT_COOKIE,
  THEME_MODE_COOKIE,
  THEME_PRESET_COOKIE,
} from "@/hifzer/theme/preferences";

const themeModes = ["light", "dark"] as const;
const themePresets = ["standard", "paper", "noor", "dawn", "rose"] as const;
const themeAccents = ["teal", "cobalt", "ember"] as const;

function json(value: unknown): string {
  return JSON.stringify(value);
}

const bootstrapScript = `
(() => {
  const root = document.documentElement;
  const readCookie = (name) => {
    const token = document.cookie.split('; ').find((entry) => entry.startsWith(name + '='));
    return token ? token.slice(name.length + 1) : null;
  };
  const readStorage = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
  const language = readCookie(${json(UI_LANGUAGE_COOKIE)}) || ${json(DEFAULT_UI_LANGUAGE)};
  const mode = pick(readStorage('hifzer_mode_v1') || readCookie(${json(THEME_MODE_COOKIE)}) || ${json(DEFAULT_THEME_DOCUMENT_STATE.mode)}, ${json(themeModes)}, ${json(DEFAULT_THEME_DOCUMENT_STATE.mode)});
  const theme = pick(readStorage('hifzer_theme_v1') || readCookie(${json(THEME_PRESET_COOKIE)}) || ${json(DEFAULT_THEME_DOCUMENT_STATE.theme)}, ${json(themePresets)}, ${json(DEFAULT_THEME_DOCUMENT_STATE.theme)});
  const accent = pick(readStorage('hifzer_accent_v1') || readCookie(${json(THEME_ACCENT_COOKIE)}) || ${json(DEFAULT_THEME_DOCUMENT_STATE.accent)}, ${json(themeAccents)}, ${json(DEFAULT_THEME_DOCUMENT_STATE.accent)});
  const langMap = ${json({
    "ur.junagarhi": "ur",
    "id.indonesian": "id",
    "tr.yildirim": "tr",
    "fa.fooladvand": "fa",
    "bn.bengali": "bn",
    "ml.abdulhameed": "ml",
    "en.sahih": "en",
  })};
  const rtlLanguages = new Set(${json(["ur.junagarhi", "fa.fooladvand"])});
  root.lang = langMap[language] || 'en';
  root.dir = rtlLanguages.has(language) ? 'rtl' : 'ltr';
  root.dataset.mode = mode;
  root.dataset.theme = theme;
  root.dataset.accent = accent;
  root.style.colorScheme = mode;
})();
`;

export function DocumentPreferencesBootstrap() {
  return (
    <script
      id="hifzer-document-preferences"
      dangerouslySetInnerHTML={{ __html: bootstrapScript }}
    />
  );
}

export function getDefaultHtmlAttributes() {
  return {
    lang: uiLanguageToHtmlLang(DEFAULT_UI_LANGUAGE),
    dir: isUiLanguageRtl(DEFAULT_UI_LANGUAGE) ? "rtl" : "ltr",
    mode: DEFAULT_THEME_DOCUMENT_STATE.mode,
    theme: DEFAULT_THEME_DOCUMENT_STATE.theme,
    accent: DEFAULT_THEME_DOCUMENT_STATE.accent,
  } as const;
}
