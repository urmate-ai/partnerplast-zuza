const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

// Ensure resolver exists
if (!config.resolver) {
  config.resolver = {};
}

// Merge source extensions safely
const existingSourceExts = config.resolver.sourceExts || [];
config.resolver.sourceExts = [...existingSourceExts, 'mjs', 'cjs'];
config.resolver.unstable_enablePackageExports = true;
 
module.exports = withNativeWind(config, { input: './global.css' });