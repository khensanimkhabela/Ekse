import type { Config } from "tailwindcss";

// Single source of truth: ../design-reference/design-tokens.css
// Colors/radii/fonts below are a 1:1 mirror of that file's tokens.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5271FF",
        brandGreen: "#73EF59",
        bgLime: "#8BF65D",
        surface: "#FFFFFF",
        inputFill: "#E6E1E1",
        textOnPrimary: "#FFFFFF",
        textHeading: "#5271FF",
        textBody: "#111111",
        textPlaceholder: "#8A8888",
      },
      borderRadius: {
        pill: "28px",
        card: "24px",
        tile: "16px",
      },
      fontFamily: {
        heading: ["Poppins", "Baloo 2", "Nunito", "sans-serif"],
        body: ["Poppins", "Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
