// Source file from the docmd project — https://github.com/mgks/docmd

const path = require('path');
const fs = require('fs-extra');
const { validateConfig } = require('./config-validator');

async function loadConfig(configPath) {
  const absoluteConfigPath = path.resolve(process.cwd(), configPath);
  if (!await fs.pathExists(absoluteConfigPath)) {
    throw new Error(`Configuration file not found at: ${absoluteConfigPath}\nRun "docmd init" to create one.`);
  }
  try {
    // Clear require cache to always get the freshest config
    delete require.cache[require.resolve(absoluteConfigPath)];
    const config = require(absoluteConfigPath);

    // Validate configuration call
    validateConfig(config);

    // Basic validation and defaults
    config.srcDir = config.srcDir || 'docs';
    config.outputDir = config.outputDir || 'site';
    config.theme = config.theme || {};
    config.theme.defaultMode = config.theme.defaultMode || 'light';
    config.navigation = config.navigation || [{ title: 'Home', path: '/' }];
    config.pageNavigation = config.pageNavigation ?? true;

    return config;
  } catch (e) {
    if (e.message === 'Invalid configuration file.') {
      throw e;
    }
    throw new Error(`Error parsing config file: ${e.message}`);
  }
}

module.exports = { loadConfig };