import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    if (disableTransitionOnChange) {
      root.classList.add("[&_*]:!transition-none");
      window.setTimeout(() => {
        root.classList.remove("[&_*]:!transition-none");
      }, 0);
    }

    if (attribute === "class") {
      root.classList.remove("light", "dark");

      if (theme !== "system") {
        root.classList.add(theme);
      }
    } else {
      if (theme === "system") {
        root.removeAttribute(attribute);
      } else {
        root.setAttribute(attribute, theme);
      }
    }
  }, [theme, attribute, disableTransitionOnChange]);

  useEffect(() => {
    if (!enableSystem) {
      return;
    }

    function handleSystemThemeChange() {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      if (theme === "system") {
        const root = window.document.documentElement;

        if (attribute === "class") {
          root.classList.remove("light", "dark");
          root.classList.add(systemTheme);
        } else {
          root.setAttribute(attribute, systemTheme);
        }
      }
    }

    handleSystemThemeChange();

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", handleSystemThemeChange);

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme, attribute, enableSystem]);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme,
      }}
      {...props}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
