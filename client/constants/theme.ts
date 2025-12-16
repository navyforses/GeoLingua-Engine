import { Platform } from "react-native";

const primaryColor = "#2563EB";
const secondaryColor = "#10B981";
const accentColor = "#F59E0B";
const errorColor = "#EF4444";

export const Colors = {
  light: {
    text: "#111827",
    textSecondary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: primaryColor,
    link: primaryColor,
    backgroundRoot: "#F9FAFB",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F3F4F6",
    backgroundTertiary: "#E5E7EB",
    border: "#E5E7EB",
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    error: errorColor,
    online: secondaryColor,
    offline: "#9CA3AF",
    inCall: primaryColor,
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#60A5FA",
    link: "#60A5FA",
    backgroundRoot: "#111827",
    backgroundDefault: "#1F2937",
    backgroundSecondary: "#374151",
    backgroundTertiary: "#4B5563",
    border: "#374151",
    primary: "#3B82F6",
    secondary: "#34D399",
    accent: "#FBBF24",
    error: "#F87171",
    online: "#34D399",
    offline: "#6B7280",
    inCall: "#3B82F6",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  cardPadding: 16,
  fabSize: 64,
  fabOffset: 16,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  price: {
    fontSize: 18,
    fontWeight: "600" as const,
    fontVariant: ["tabular-nums"] as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
