// Source file from the docmd project — https://github.com/docmd-io/docmd

const path = require('path');
const fs = require('./fs-utils');
const { validateConfig } = require('./config-validator');

async function loadConfig(configPath) {
  const cwd = process.cwd();
  let absoluteConfigPath = path.resolve(cwd, configPath);

  // 1. Check if the requested config file exists
  if (!await fs.pathExists(absoluteConfigPath)) {
    // 2. Fallback Logic:
    // If the user didn't specify a custom path (i.e., using default 'docmd.config.js')
    // AND 'docmd.config.js' is missing...
    // Check if legacy 'config.js' exists.
    if (configPath === 'docmd.config.js') {
      const legacyPath = path.resolve(cwd, 'config.js');
      if (await fs.pathExists(legacyPath)) {
        // console.log('⚠️  Using legacy config.js. Please rename to docmd.config.js'); // Optional warning
        absoluteConfigPath = legacyPath;
      } else {
        // Neither exists
        throw new Error(`Configuration file not found at: ${absoluteConfigPath}\nRun "docmd init" to create one.`);
      }
    } else {
      // User specified a custom path that doesn't exist
      throw new Error(`Configuration file not found at: ${absoluteConfigPath}`);
    }
  }

  try {
    // Clear require cache to always get the freshest config (important for dev mode reloading)
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