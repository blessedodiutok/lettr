/** @type {import('tailwindcss').Config} */
// LETTR tokens for the mobile app — same values as the web design system (light theme).
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#F3F5F8",
        surface: "#FFFFFF",
        "surface-2": "#EDF1F5",
        line: "#DAE2EA",
        "line-strong": "#C3CFDB",
        ink: "#0F1C2B",
        "ink-2": "#34465A",
        muted: "#5B6B7D",
        navy: "#1A3C5E",
        "navy-deep": "#0F2740",
        "navy-soft": "#E5EDF5",
        brass: "#B8862A",
        "brass-soft": "#F5ECD9",
        "on-brass": "#1B1406",
        ok: "#1D774A",
        "ok-soft": "#E1F2E8",
        warn: "#8E5508",
        "warn-soft": "#FAEEDA",
        bad: "#B42318",
        "bad-soft": "#FBE6E3",
        info: "#1F5FA8",
        "info-soft": "#E3EDF9",
      },
      fontFamily: {
        // Custom fonts carry their own weight, so each weight is its own family.
        display: ["Newsreader_500Medium"],
        sans: ["DMSans_400Regular"],
        "sans-medium": ["DMSans_500Medium"],
        "sans-bold": ["DMSans_700Bold"],
      },
    },
  },
  plugins: [],
};
