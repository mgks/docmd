// Source file from the docmd project — https://github.com/docmd-io/docmd

const chalk = require('chalk');

const { version } = require('../../package.json');

const printBanner = () => {
  const logo = `
                       
${chalk.blue('     _                 _ ')}
${chalk.blue('   _| |___ ___ _____ _| |')}
${chalk.blue('  | . | . |  _|     | . |')}
${chalk.blue('  |___|___|___|_|_|_|___|')}
  `;

  console.log(logo);
  console.log(`   ${chalk.dim(`v${version}`)}`);
  console.log(`\n`);
};

module.exports = { printBanner };