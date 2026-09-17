import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#16130f", soft: "#4a4239", faint: "#8b8073" },
        parchment: { DEFAULT: "#fbf7f0", deep: "#f3ece0", edge: "#e6dcc9" },
        accent: { DEFAULT: "#1e6b5e", deep: "#164f46", soft: "#e3f0ec" },
        gold: { DEFAULT: "#b4802a", soft: "#f6ecd8" },
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
        hebrew: ["Frank Ruehl CLM", "Times New Roman", "David", "serif"],
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(1)" }, "45%": { transform: "scale(1.28)" }, "100%": { transform: "scale(1)" } },
      },
      animation: { rise: "rise .28s ease-out both", pop: "pop .3s ease-out" },
    },
  },
  plugins: [],
} satisfies Config;
