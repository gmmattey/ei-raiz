import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // BrandBook tokens (fonte: guia visual)
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-surface": "var(--bg-surface)",
        "bg-inverse": "var(--bg-inverse)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-disabled": "var(--text-disabled)",

        "brand-primary": "var(--brand-primary)",

        "state-success": "var(--state-success)",
        "state-warning": "var(--state-warning)",
        "state-error": "var(--state-error)",

        "border-default": "var(--border-default)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        card: "0 8px 24px rgba(11, 18, 24, 0.08)",
      },
      keyframes: {
        navProgress: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "nav-progress": "navProgress 1.1s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

