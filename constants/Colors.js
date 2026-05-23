export const getFrostColors = (isDark) => {
  if (isDark) {
    return ["rgba(15,25,35,0.92)", "rgba(15,25,35,0.35)", "rgba(15,25,35,0.92)"];
  }
  return ["rgba(255,255,255,0.90)", "rgba(255,255,255,0.25)", "rgba(255,255,255,0.90)"];
};

export const Colors = {
  light: {
    bg: "#FFFFFF",
    cardBg: "#FAFAFA",
    surface: "#F3F4F6",
    border: "#E5E7EB",
    borderLight: "#F0F1F3",
    text: "#0F172A",
    textMuted: "#64748B",
    textMain: "#0F172A",
    brand: "#6366F1",
    brandLight: "rgba(99,102,241,0.1)",
    semantic: "#059669",
    semanticLight: "rgba(5,150,105,0.1)",
    accentGold: "#D97706",
    accentGoldLight: "rgba(217,119,6,0.1)",
    accentSlate: "#94A3B8",
    inputBg: "#F3F4F6",
    placeholder: "#9CA3AF",
    overlay: "rgba(15,23,42,0.5)",
    shadow: "rgba(15,23,42,0.08)",
    shadowSm: "rgba(15,23,42,0.04)",
    shadowLg: "rgba(15,23,42,0.12)",
    cardRadius: 32,
    elementRadius: 16,
    pillRadius: 20,
  },
  dark: {
    bg: "#0F1923",
    cardBg: "#0B131E",
    surface: "#1A2235",
    border: "#2D3748",
    borderLight: "#5A6B82",
    text: "#EDE8DD",
    textMuted: "#8895A7",
    textMain: "#EDE8DD",
    // brand: "#8B2252", // old burgundy
    brand: "#C87D3A",
    brandLight: "rgba(200,125,58,0.2)",
    semantic: "#4A8C6F",
    semanticLight: "rgba(74,140,111,0.2)",
    accentGold: "#C9956B",
    accentGoldLight: "rgba(201,149,107,0.2)",
    accentSlate: "#5B6A8A",
    inputBg: "#1A2235",
    placeholder: "#5B6A8A",
    overlay: "rgba(0,0,0,0.75)",
    shadow: "rgba(0,0,0,0.3)",
    shadowSm: "rgba(0,0,0,0.2)",
    shadowLg: "rgba(0,0,0,0.4)",
    cardRadius: 32,
    elementRadius: 16,
    pillRadius: 20,
  },
};
