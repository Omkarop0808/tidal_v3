/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic Oceanic Palette
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        marine: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        
        // Brand Primary & Accents
        primary: {
          DEFAULT: "#00e5ff",
          container: "#083344",
          hover: "#38bdf8",
        },
        secondary: {
          DEFAULT: "#ff4d00",
          container: "#ea580c",
          hover: "#ff6622",
        },
        tertiary: {
          DEFAULT: "#10b981",
          container: "#064e3b",
          hover: "#34d399",
        },

        // True Black Surface System (Original Tidal Palette)
        abyss: {
          DEFAULT: "#000000",
          card: "#0a0a0a",
          elevated: "#141414",
          border: "#262626",
          highlight: "#1f1f1f",
        },

        // Semantic Surface & Component Tokens for Dark / Light Theming
        background: "#000000",
        card: {
          DEFAULT: "#0a0a0a",
          foreground: "#ffffff",
        },
        surface: {
          DEFAULT: "#0a0a0a",
          dim: "#000000",
          bright: "#141414",
          variant: "#1a1a1a",
        },
        muted: {
          DEFAULT: "#141414",
          foreground: "#a3a3a3",
        },
        border: "#262626",
        "on-surface": "#ffffff",
        "on-background": "#ffffff",

        // Status Alerts
        error: {
          DEFAULT: "#ef4444",
          container: "#7f1d1d",
        },
        warning: {
          DEFAULT: "#f59e0b",
          container: "#78350f",
        },
        success: {
          DEFAULT: "#10b981",
          container: "#064e3b",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        headline: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        display: ["Space Grotesk", "Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        body: ["Inter", "Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        "glow-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.35)",
        "glow-emerald": "0 0 20px -3px rgba(16, 185, 129, 0.35)",
        "glow-orange": "0 0 20px -3px rgba(249, 115, 22, 0.35)",
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radar-sweep 4s linear infinite",
        "scan-line": "scan-line 3s linear infinite",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(100%)" },
        }
      }
    },
  },
  plugins: [],
}
