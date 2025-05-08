#!/usr/bin/env node

const { Command } = require('commander');
const { version } = require('../package.json');
const { initProject } = require('../src/commands/init');
const { buildSite } = require('../src/commands/build');
const { startDevServer } = require('../src/commands/dev');

const program = new Command();

program
  .name('docmd')
  .description('Generate beautiful, lightweight static documentation sites directly from your Markdown files.')
  .version(version);

program
  .command('init')
  .description('Initialize a new docmd project (creates docs/ and config.js)')
  .action(async () => {
    try {
      await initProject();
      console.log('✅ docmd project initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing project:', error.message);
      process.exit(1);
    }
  });

program
  .command('build')
  .description('Build the static site from Markdown files and config.js')
  .option('-c, --config <path>', 'Path to config.js file', 'config.js')
  .action(async (options) => {
    try {
      console.log('🚀 Starting build process...');
      await buildSite(options.config);
      console.log('✅ Build complete! Site generated in `site/` directory.');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start a live preview development server')
  .option('-c, --config <path>', 'Path to config.js file', 'config.js')
  .action(async (options) => {
    try {
      await startDevServer(options.config);
    } catch (error) {
      console.error('❌ Dev server failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}