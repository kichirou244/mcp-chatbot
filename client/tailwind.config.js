/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,html}", "./public/index.html"],
  theme: {
    extend: {
      keyframes: {
        blink: {
          "0%, 80%, 100%": { opacity: "0.2" },
          "40%": { opacity: "1" },
        },
      },
      animation: {
        blink: "blink 1s infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
