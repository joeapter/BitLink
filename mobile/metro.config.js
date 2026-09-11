const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// mobile/ is nested inside the main BitLink site's git repo but is a fully
// separate project with its own package.json/lockfile — Metro's default
// hierarchical lookup was reaching up into the parent repo's node_modules
// and finding a second copy of react there, which expo-doctor flags as a
// duplicate native module (real risk of "Invalid hook call" at runtime).
// Scoping resolution to this directory only fixes that at the source.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
