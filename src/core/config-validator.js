// Source file from the docmd project — https://github.com/docmd-io/docmd

const chalk = require('chalk');

// Known configuration keys for typo detection
const KNOWN_KEYS = [
  'siteTitle', 'siteUrl', 'srcDir', 'outputDir', 'logo', 
  'sidebar', 'theme', 'customJs', 'autoTitleFromH1', 
  'copyCode', 'plugins', 'navigation', 'footer', 'sponsor', 'favicon',
  'search', 'minify', 'editLink', 'pageNavigation'
];

// Common typos mapping
const TYPO_MAPPING = {
  'site_title': 'siteTitle',
  'sitetitle': 'siteTitle',
  'baseUrl': 'siteUrl',
  'source': 'srcDir',
  'out': 'outputDir',
  'customCSS': 'theme.customCss',
  'customcss': 'theme.customCss',
  'customJS': 'customJs',
  'customjs': 'customJs',
  'nav': 'navigation',
  'menu': 'navigation'
};

function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // 1. Required Fields
  if (!config.siteTitle) {
    errors.push('Missing required property: "siteTitle"');
  }

  // 2. Type Checking
  if (config.navigation && !Array.isArray(config.navigation)) {
    errors.push('"navigation" must be an Array');
  }

  if (config.customJs && !Array.isArray(config.customJs)) {
    errors.push('"customJs" must be an Array of strings');
  }

  if (config.theme) {
    if (config.theme.customCss && !Array.isArray(config.theme.customCss)) {
      errors.push('"theme.customCss" must be an Array of strings');
    }
  }

  // 3. Typos and Unknown Keys (Top Level)
  Object.keys(config).forEach(key => {
    if (TYPO_MAPPING[key]) {
      warnings.push(`Found unknown property "${key}". Did you mean "${TYPO_MAPPING[key]}"?`);
    }
  });

  // 4. Theme specific typos
  if (config.theme) {
    if (config.theme.customCSS) {
      warnings.push('Found "theme.customCSS". Did you mean "theme.customCss"?');
    }
  }

  // Output results
  if (warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Configuration Warnings:'));
    warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
  }

  if (errors.length > 0) {
    console.log(chalk.red('\n❌ Configuration Errors:'));
    errors.forEach(e => console.log(chalk.red(`   - ${e}`)));
    console.log('');
    throw new Error('Invalid configuration file.');
  }
}

module.exports = { validateConfig };