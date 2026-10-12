// File: apps/mobile/babel.config.js
// Babel config for Expo 55 + NativeWind v4
// NativeWind v4 uses a babel plugin to transform Tailwind class names at compile time

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      // Reanimated plugin MUST be listed last
      "react-native-reanimated/plugin",
    ],
  };
};
