#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { version } = require('../package.json');
const { initProject } = require('../src/commands/init');
const { buildSite } = require('../src/commands/build');
const { startDevServer } = require('../src/commands/dev');
const { printBanner } = require('../src/core/logger');

// Helper function to find the config file
const findConfigFile = () => {
  const newConfigPath = 'docmd.config.js';
  const oldConfigPath = 'config.js';

  if (fs.existsSync(path.resolve(process.cwd(), newConfigPath))) {
    return newConfigPath;
  }
  if (fs.existsSync(path.resolve(process.cwd(), oldConfigPath))) {
    return oldConfigPath;
  }
  
  throw new Error('Configuration file not found. Please create a docmd.config.js file or run "docmd init".');
};

const program = new Command();

program
  .name('docmd')
  .description('Generate beautiful, lightweight static documentation sites directly from your Markdown files.')
  .version(version);

program
  .command('init')
  .description('Initialize a new docmd project (creates docs/ and config file)')
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
  .description('Build the static site from Markdown files and config')
  .option('-c, --config <path>', 'Path to config file')
  .option('-p, --preserve', 'Preserve existing asset files instead of updating them')
  .option('--no-preserve', 'Force update all asset files, overwriting existing ones')
  .option('--silent', 'Suppress log output')
  .action(async (options) => {
    try {
      if (!options.silent) { printBanner(); }

      const originalLog = console.log;
      if (options.silent) { console.log = () => {}; }

      const configPath = options.config || findConfigFile();
      console.log(`🚀 Starting build process using ${configPath}...`);
      await buildSite(configPath, { 
        preserve: options.preserve
      });

      console.log = originalLog;
      if (!options.silent) {
        console.log('✅ Build complete! Site generated in `site/` directory.');
      }

    } catch (error) {
      console.error('❌ Build failed:', error.message);
      // console.error(error.stack);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start a live preview development server')
  .option('-c, --config <path>', 'Path to config file')
  .option('--port <number>', 'Specify a port for the dev server')
  .option('-p, --preserve', 'Preserve existing asset files instead of updating them')
  .option('--no-preserve', 'Force update all asset files, overwriting existing ones')
  .option('--silent', 'Suppress log output')
  .action(async (options) => {
    try {
      if (!options.silent) { printBanner(); }

      if (options.silent) {
        const originalLog = console.log;
        console.log = (message) => {
          if (message && message.includes('Dev server started at')) {
            originalLog(message);
          }
        };
      }
      const configPath = options.config || findConfigFile();
      await startDevServer(configPath, { preserve: options.preserve, port: options.port });

    } catch (error) {
      console.error('❌ Dev server failed:', error.message);
      // console.error(error.stack);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}