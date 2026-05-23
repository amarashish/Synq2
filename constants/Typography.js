import { Platform } from "react-native";

// Modern 2026 Instagram-Style Font System for SYNQ
// Poppins: Trendy, modern geometric font perfect for headlines (like Instagram)
// Inter: Clean, professional sans-serif for body text
export const FontFamily = {
  HEADING: "Poppins-Bold", // Instagram-style trendy headlines
  HEADING_SEMI: "Poppins-SemiBold", // Secondary headings
  BODY: "Inter-Regular", // Clean, readable body text
  BODY_SEMI: "Inter-SemiBold", // Medium emphasis
  BODY_BOLD: "Inter-Bold", // Bold text
};

export const Typography = {
  h1: {
    fontFamily: FontFamily.HEADING,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FontFamily.HEADING,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: FontFamily.HEADING_SEMI,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  h4: {
    fontFamily: FontFamily.HEADING_SEMI,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: FontFamily.BODY,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: FontFamily.BODY,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: FontFamily.BODY_SEMI,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14,
    letterSpacing: 1.2,
  },
  badge: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 10,
    letterSpacing: 0.8,
  },
  button: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    letterSpacing: 1,
  },
  caps: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 14,
    letterSpacing: 1.5,
  },
};
