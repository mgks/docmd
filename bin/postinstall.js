// bin/postinstall.js

const chalk = require('chalk');

// This script runs after 'npm install', runs only when the user installs it globally and not in a CI environment

if (process.env.npm_config_global && !process.env.CI) {
  console.log(chalk.green('\n🎉 Thank you for installing docmd!'));
  console.log('\nTo get started, run the following commands:');
  console.log(`\n  ${chalk.cyan('docmd init my-awesome-docs')}`);
  console.log(`  ${chalk.cyan('cd my-awesome-docs')}`);
  console.log(`  ${chalk.cyan('npm start')}`);
  console.log('\nFor complete documentation, visit: https://docmd.mgks.dev');
}