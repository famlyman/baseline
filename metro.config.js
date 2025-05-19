const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .cjs files
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Add support for Node.js core modules
config.resolver.extraNodeModules = {
  ...require('node-libs-react-native'),
  ...config.resolver.extraNodeModules,
};

// Use our custom shim for WebSocket
config.resolver.extraNodeModules['ws'] = path.resolve(__dirname, 'shims/ws');

// Explicitly exclude node_modules from being transformed by Babel
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
  resolver: {
    resolverMainFields: ['react-native', 'browser', 'main'],
  },
});

module.exports = config;
