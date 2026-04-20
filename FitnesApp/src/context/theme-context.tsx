import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Platform,
  useColorScheme as useSystemColorScheme,
} from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (theme: ThemePreference) => void;
};

const THEME_STORAGE_KEY = "fitnes_theme_preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");

  const resolvedTheme: ResolvedTheme =
    themePreference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedValue) => {
        if (!isMounted) return;

        if (
          storedValue === "light" ||
          storedValue === "dark" ||
          storedValue === "system"
        ) {
          setThemePreferenceState(storedValue);
        }
      })
      .catch((error) => {
        console.warn("Failed to load theme preference:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setColorScheme(resolvedTheme);

    AsyncStorage.setItem(THEME_STORAGE_KEY, themePreference).catch((error) => {
      console.warn("Failed to save theme preference:", error);
    });
  }, [setColorScheme, themePreference, resolvedTheme]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const isDark = resolvedTheme === "dark";

    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = resolvedTheme;
    document.body.style.backgroundColor = isDark ? "#050509" : "#F9FAFB";
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference: setThemePreferenceState,
    }),
    [resolvedTheme, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return context;
}
