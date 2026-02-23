/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: logo purple + mint
        brand: {
          bg: "#1a0628",
          surface: "#2d0a54",
          elevated: "#3b1373",
          border: "rgba(255,255,255,0.12)",
          "border-hover": "rgba(255,255,255,0.24)",
        },
        primary: {
          DEFAULT: "#00e5b4",
          foreground: "#0d2818",
          muted: "rgba(0,229,180,0.15)",
          hover: "#00c9a0",
        },
        // Semantic
        success: "#00e5b4",
        destructive: "#f45866",
        muted: "#9c6ade",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "0.5rem",
        "brand-lg": "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.25), 0 1px 2px -1px rgba(0,0,0,0.25)",
        elevated: "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2)",
      },
      ringOffsetColor: {
        "brand-surface": "#2d0a54",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
