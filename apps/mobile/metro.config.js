// File: apps/mobile/metro.config.js
// Metro bundler config for NativeWind v4 + Tailwind v3
// withNativeWind wraps the base config and teaches Metro to process CSS class names

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  // Points Metro to your global CSS file that imports Tailwind
  input: "./app/global.css",
});
