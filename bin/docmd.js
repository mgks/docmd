#!/usr/bin/env node

const { program } = require('commander');
const { startDevServer } = require('../src/commands/dev'); 
const { buildSite } = require('../src/commands/build');
const { initProject } = require('../src/commands/init');
const { build: buildLive } = require('../src/commands/live');
const { version } = require('../package.json');
const { printBanner } = require('../src/core/logger');
const path = require('path');
const { spawn } = require('child_process');

program
  .name('docmd')
  .description('The minimalist, zero-config documentation generator')
  .version(version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command');

program
  .command('init')
  .description('Initialize a new documentation project')
  .action(() => {
    printBanner();
    initProject();
  });

program
  .command('dev')
  .description('Start the development server with live reload')
  .option('-c, --config <path>', 'Path to configuration file', 'docmd.config.js')
  .option('-p, --port <number>', 'Port to run the server on')
  .option('--preserve', 'Preserve existing assets', false)
  .action((options) => {
    printBanner();
    startDevServer(options.config, options);
  });

program
  .command('build')
  .description('Build the static documentation site')
  .option('-c, --config <path>', 'Path to configuration file', 'docmd.config.js')
  .option('--preserve', 'Preserve existing assets', false)
  .action((options) => {
    buildSite(options.config, { isDev: false, preserve: options.preserve });
  })
  .option('--offline', 'Generate a build optimized for file:// viewing (appends index.html)', false)
  .action((options) => {
    buildSite(options.config, { isDev: false, preserve: options.preserve, offline: options.offline });
  });

program
  .command('live')
  .description('Build and serve the browser-based live editor')
  .action(async () => {
    try {
        await buildLive();

        console.log('\n🌍 Launching server...');
        console.log('   Press Ctrl+C to stop.\n');

        const distPath = path.resolve(__dirname, '../dist');
        const serveCmd = `npx serve "${distPath}"`;

        spawn(serveCmd, { stdio: 'inherit', shell: true });
        
    } catch (e) {
        console.error('Live build failed:', e);
        process.exit(1);
    }
  });

program.parse();