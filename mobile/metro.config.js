const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── Root cause: socket.io-client ships ESM with import.meta ──────────────────
// Fix: force Metro to use the CommonJS build of socket.io-client
// by disabling package.json "exports" resolution for it.
config.resolver = {
  ...config.resolver,
  sourceExts: [...new Set([...(config.resolver.sourceExts ?? []), 'mjs', 'cjs'])],
  // Disable exports field resolution — falls back to "main" (CJS build)
  unstable_enablePackageExports: false,
  // Exclude large non-source files from bundling
  blockList: [
    /package-lock\.json$/,
    /\.postman\.json$/,
  ],
};

module.exports = withNativeWind(config, { input: './global.css' });
