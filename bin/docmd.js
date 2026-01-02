#!/usr/bin/env node

const { program } = require('commander');
// This import corresponds to module.exports = { startDevServer } in src/commands/dev.js
const { startDevServer } = require('../src/commands/dev'); 
const { buildSite } = require('../src/commands/build');
const { initProject } = require('../src/commands/init');
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
  .action(() => {
    const scriptPath = path.resolve(__dirname, '../scripts/build-live.js');
    const distPath = path.resolve(__dirname, '../dist');
    
    console.log('🚀 Starting Live Editor build...');
    
    // Using spawn ensures the build runs in a fresh process context
    const build = spawn(process.execPath, [scriptPath], { stdio: 'inherit' });
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('\n🌍 Launching server...');
        console.log('   Press Ctrl+C to stop.\n');
        
        // Fix for Node DeprecationWarning regarding shell: true
        const serveCmd = `npx serve "${distPath}"`;
        spawn(serveCmd, { stdio: 'inherit', shell: true });
      }
    });
  });

program.parse();