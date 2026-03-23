import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeMode, ThemeColors, Themes } from "@/constants/colors";
import { Language, translations, TranslationKey } from "@/constants/i18n";

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "@leadlocker_theme";
const LANG_KEY = "@leadlocker_language";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark-navy");
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, LANG_KEY]).then((pairs) => {
      const storedTheme = pairs[0][1] as ThemeMode | null;
      const storedLang = pairs[1][1] as Language | null;
      if (storedTheme) setThemeModeState(storedTheme);
      if (storedLang) {
        setLanguageState(storedLang);
      } else {
        AsyncStorage.setItem(LANG_KEY, "en");
      }
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      colors: Themes[themeMode],
      isDark: themeMode !== "light",
      language,
      setLanguage,
      t,
    }),
    [themeMode, language]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
