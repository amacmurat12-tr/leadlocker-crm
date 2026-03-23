export type ThemeMode = "light" | "dark-black" | "dark-navy";

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  cardShadow: string;
  overlay: string;
  navyAccent: string;
}

const accent = "#2D6BE4";
const accentLight = "#EBF1FD";
const accentDark = "#1A4DB3";
const success = "#22C55E";
const successLight = "#DCFCE7";
const warning = "#F59E0B";
const warningLight = "#FEF3C7";
const danger = "#EF4444";
const dangerLight = "#FEE2E2";
const navyAccent = "#3B82F6";

export const Themes: Record<ThemeMode, ThemeColors> = {
  light: {
    background: "#F8FAFC",
    backgroundSecondary: "#F1F5F9",
    backgroundTertiary: "#E2E8F0",
    surface: "#FFFFFF",
    surfaceSecondary: "#F8FAFC",
    border: "#E2E8F0",
    borderLight: "#F1F5F9",
    text: "#0F172A",
    textSecondary: "#475569",
    textTertiary: "#94A3B8",
    accent,
    accentLight,
    accentDark,
    success,
    successLight,
    warning,
    warningLight,
    danger,
    dangerLight,
    tint: accent,
    tabIconDefault: "#94A3B8",
    tabIconSelected: accent,
    cardShadow: "rgba(15,23,42,0.08)",
    overlay: "rgba(15,23,42,0.5)",
    navyAccent,
  },
  "dark-black": {
    background: "#000000",
    backgroundSecondary: "#0D0D0D",
    backgroundTertiary: "#1A1A1A",
    surface: "#111111",
    surfaceSecondary: "#1A1A1A",
    border: "#2A2A2A",
    borderLight: "#1E1E1E",
    text: "#FFFFFF",
    textSecondary: "#A3A3A3",
    textTertiary: "#666666",
    accent,
    accentLight: "rgba(45,107,228,0.15)",
    accentDark,
    success,
    successLight: "rgba(34,197,94,0.15)",
    warning,
    warningLight: "rgba(245,158,11,0.15)",
    danger,
    dangerLight: "rgba(239,68,68,0.15)",
    tint: accent,
    tabIconDefault: "#555555",
    tabIconSelected: accent,
    cardShadow: "rgba(0,0,0,0.4)",
    overlay: "rgba(0,0,0,0.7)",
    navyAccent,
  },
  "dark-navy": {
    background: "#0A1628",
    backgroundSecondary: "#0F1E38",
    backgroundTertiary: "#152843",
    surface: "#0F1E38",
    surfaceSecondary: "#152843",
    border: "#1E3557",
    borderLight: "#172D4A",
    text: "#F0F4FF",
    textSecondary: "#8BA5CC",
    textTertiary: "#4D6D94",
    accent: navyAccent,
    accentLight: "rgba(59,130,246,0.15)",
    accentDark: "#2563EB",
    success,
    successLight: "rgba(34,197,94,0.15)",
    warning,
    warningLight: "rgba(245,158,11,0.15)",
    danger,
    dangerLight: "rgba(239,68,68,0.15)",
    tint: navyAccent,
    tabIconDefault: "#4D6D94",
    tabIconSelected: navyAccent,
    cardShadow: "rgba(0,0,0,0.4)",
    overlay: "rgba(10,22,40,0.85)",
    navyAccent,
  },
};

export default {
  light: {
    text: "#0F172A",
    background: "#F8FAFC",
    tint: accent,
    tabIconDefault: "#94A3B8",
    tabIconSelected: accent,
  },
};
