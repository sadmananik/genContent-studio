"use client";

export const THEME_STORAGE_KEY = "gencontent-theme-preference";
export const THEME_VALUES = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system"
};

export function getStoredThemePreference() {
  if (typeof window === "undefined") {
    return THEME_VALUES.SYSTEM;
  }

  return normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function saveThemePreference(theme) {
  const normalizedTheme = normalizeThemePreference(theme);

  window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  applyThemePreference(normalizedTheme);
  return normalizedTheme;
}

export function applyThemePreference(theme) {
  const normalizedTheme = normalizeThemePreference(theme);
  const activeTheme = resolveActiveTheme(normalizedTheme);
  const root = document.documentElement;

  root.dataset.theme = normalizedTheme;
  root.dataset.activeTheme = activeTheme;
  root.style.colorScheme = activeTheme;
}

export function watchSystemThemePreference(theme, onChange) {
  if (typeof window === "undefined" || theme !== THEME_VALUES.SYSTEM) {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    applyThemePreference(THEME_VALUES.SYSTEM);
    onChange?.();
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}

function normalizeThemePreference(theme) {
  return Object.values(THEME_VALUES).includes(theme) ? theme : THEME_VALUES.SYSTEM;
}

function resolveActiveTheme(theme) {
  if (theme !== THEME_VALUES.SYSTEM) {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEME_VALUES.DARK
    : THEME_VALUES.LIGHT;
}
