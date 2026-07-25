const { getDefaultConfig } = require("expo/metro-config");
const { withVarlockMetroConfig } = require("@varlock/expo-integration/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withVarlockMetroConfig(
  withUniwindConfig(config, {
    cssEntryFile: "./global.css",
    dtsFile: "./uniwind-types.d.ts",
  }),
);
