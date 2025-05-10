const path = require('path');
const fs = require('fs-extra');

async function loadConfig(configPath) {
  const absoluteConfigPath = path.resolve(process.cwd(), configPath);
  if (!await fs.pathExists(absoluteConfigPath)) {
    throw new Error(`Configuration file not found: ${absoluteConfigPath}`);
  }
  try {
    // Clear require cache to always get the freshest config
    delete require.cache[require.resolve(absoluteConfigPath)];
    const config = require(absoluteConfigPath);

    // Basic validation and defaults
    if (!config.siteTitle) throw new Error('`siteTitle` is missing in config.js');
    config.srcDir = config.srcDir || 'docs';
    config.outputDir = config.outputDir || 'site';
    config.theme = config.theme || {};
    config.theme.defaultMode = config.theme.defaultMode || 'light';
    config.navigation = config.navigation || [{ title: 'Home', path: '/' }];

    return config;
  } catch (e) {
    throw new Error(`Error loading or parsing config file ${absoluteConfigPath}: ${e.message}`);
  }
}

module.exports = { loadConfig };