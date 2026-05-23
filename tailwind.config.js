/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter-Regular"],
        "inter-regular": ["Inter-Regular"],
        "inter-medium": ["Inter-Medium"],
        "inter-semibold": ["Inter-SemiBold"],
        "inter-bold": ["Inter-Bold"],
        "inter-extrabold": ["Inter-ExtraBold"],
        "inter-black": ["Inter-Black"],
        "poppins-bold": ["Poppins-Bold"],
        "poppins-semibold": ["Poppins-SemiBold"],
        "caveatbrush": ["CaveatBrush_400Regular"],
        heading: ["Poppins-Bold"],
        body: ["Inter-Regular"],
      },
      colors: {
        brand: {
          DEFAULT: "#8B2252",
          light: "rgba(139,34,82,0.15)",
        },
        gold: {
          DEFAULT: "#C9956B",
          light: "rgba(201,149,107,0.15)",
        },
        navy: {
          dark: "#0F1923",
          DEFAULT: "#1A2235",
        },
        parchment: {
          DEFAULT: "#F5F0E8",
          dark: "#EDE8DD",
        },
      },
      borderRadius: {
        card: "32px",
        element: "16px",
        pill: "20px",
      },
    },
  },
  plugins: [],
}
