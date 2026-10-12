// Metro config for Expo 55 + NativeWind 4 in a pnpm monorepo.
// Workspace packages (@lettr/*) are resolved from source via their "react-native" export condition.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
