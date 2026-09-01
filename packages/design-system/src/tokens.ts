/**
 * Metland Kinetic System — Design Tokens
 * Source: docs/DESIGN.md
 */

export const colors = {
  surface: "#f6faf9",
  surfaceDim: "#d6dbda",
  surfaceBright: "#f6faf9",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f0f4f4",
  surfaceContainer: "#eaefee",
  surfaceContainerHigh: "#e4e9e8",
  surfaceContainerHighest: "#dfe3e3",
  onSurface: "#171d1c",
  onSurfaceVariant: "#3d4949",
  inverseSurface: "#2c3131",
  inverseOnSurface: "#edf2f1",
  outline: "#6d7979",
  outlineVariant: "#bcc9c8",
  surfaceTint: "#006a6a",
  primary: "#006767",
  onPrimary: "#ffffff",
  primaryContainer: "#008282",
  onPrimaryContainer: "#f3fffe",
  inversePrimary: "#6fd7d6",
  secondary: "#545f73",
  onSecondary: "#ffffff",
  secondaryContainer: "#d5e0f8",
  onSecondaryContainer: "#586377",
  tertiary: "#8f4922",
  onTertiary: "#ffffff",
  tertiaryContainer: "#ad6038",
  onTertiaryContainer: "#fffbff",
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  primaryFixed: "#8cf3f3",
  primaryFixedDim: "#6fd7d6",
  onPrimaryFixed: "#002020",
  onPrimaryFixedVariant: "#004f4f",
  secondaryFixed: "#d8e3fb",
  secondaryFixedDim: "#bcc7de",
  onSecondaryFixed: "#111c2d",
  onSecondaryFixedVariant: "#3c475a",
  tertiaryFixed: "#ffdbcb",
  tertiaryFixedDim: "#ffb693",
  onTertiaryFixed: "#341000",
  onTertiaryFixedVariant: "#74340f",
  background: "#f6faf9",
  onBackground: "#171d1c",
  surfaceVariant: "#dfe3e3",
  statusGreen: "#10B981",
  statusYellow: "#F59E0B",
  statusRed: "#EF4444",
  statusBlue: "#3B82F6",
  dataMono: "#64748B",
} as const;

export const typography = {
  displayLg: {
    fontFamily: "Hanken Grotesk",
    fontSize: "48px",
    fontWeight: "700",
    lineHeight: "56px",
    letterSpacing: "-0.02em",
  },
  headlineLg: {
    fontFamily: "Hanken Grotesk",
    fontSize: "32px",
    fontWeight: "600",
    lineHeight: "40px",
  },
  headlineLgMobile: {
    fontFamily: "Hanken Grotesk",
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "32px",
  },
  headlineMd: {
    fontFamily: "Hanken Grotesk",
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "32px",
  },
  bodyLg: {
    fontFamily: "Inter",
    fontSize: "18px",
    fontWeight: "400",
    lineHeight: "28px",
  },
  bodyMd: {
    fontFamily: "Inter",
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: "24px",
  },
  bodySm: {
    fontFamily: "Inter",
    fontSize: "14px",
    fontWeight: "400",
    lineHeight: "20px",
  },
  labelMd: {
    fontFamily: "Inter",
    fontSize: "12px",
    fontWeight: "600",
    lineHeight: "16px",
    letterSpacing: "0.05em",
  },
  dataMono: {
    fontFamily: "JetBrains Mono",
    fontSize: "13px",
    fontWeight: "450",
    lineHeight: "18px",
  },
} as const;

export const rounded = {
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px",
} as const;

export const spacing = {
  unit: "4px",
  gutterDense: "12px",
  gutterDiscovery: "24px",
  marginPage: "32px",
  marginMobile: "16px",
} as const;

export const breakpoints = {
  mobile: 600,
  tablet: 1024,
  desktop: 1440,
} as const;

// Semantic aliases
export const semantic = {
  success: colors.statusGreen,
  warning: colors.statusYellow,
  critical: colors.statusRed,
  info: colors.statusBlue,
} as const;
