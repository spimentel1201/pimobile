const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add nanoid to watchFolders to ensure it's properly bundled
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'node_modules/nanoid'),
];

// Ensure non-secure folder is included
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Add resolution for nanoid
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'nanoid': path.resolve(__dirname, 'node_modules/nanoid'),
  'nanoid/non-secure': path.resolve(__dirname, 'node_modules/nanoid/non-secure'),
};

module.exports = config;