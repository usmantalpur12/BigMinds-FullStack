const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for additional asset types
config.resolver.assetExts.push(
  // Video formats
  'mp4',
  'avi',
  'mov',
  'mkv',
  // Audio formats  
  'mp3',
  'wav',
  'aac',
  // Font formats
  'ttf',
  'otf',
  'woff',
  'woff2'
);

// Improve module resolution for nested directories and dynamic routes
config.resolver.sourceExts.push('tsx', 'ts');
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable better path resolution for nested dynamic routes
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Add watch folders for better hot reload
config.watchFolders = [
  path.resolve(__dirname),
];

module.exports = config; 