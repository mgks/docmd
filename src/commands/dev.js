// Source file from the docmd project — https://github.com/mgks/docmd

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const os = require('os');
const readline = require('readline');
const { buildSite } = require('./build');
const { loadConfig } = require('../core/config-loader');

function formatPathForDisplay(absolutePath, cwd) {
  const relativePath = path.relative(cwd, absolutePath);
  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return `./${relativePath}`;
  }
  return relativePath;
}

function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

async function startDevServer(configPathOption, options = { preserve: false, port: undefined }) {
  let config = await loadConfig(configPathOption);
  const CWD = process.cwd();

  // Config Fallback for Watcher
  let actualConfigPath = path.resolve(CWD, configPathOption);
  if (configPathOption === 'docmd.config.js' && !await fs.pathExists(actualConfigPath)) {
      const legacyPath = path.resolve(CWD, 'config.js');
      if (await fs.pathExists(legacyPath)) {
          actualConfigPath = legacyPath;
      }
  }

  const resolveConfigPaths = (currentConfig) => {
    return {
      outputDir: path.resolve(CWD, currentConfig.outputDir),
      srcDirToWatch: path.resolve(CWD, currentConfig.srcDir),
      configFileToWatch: actualConfigPath,
      userAssetsDir: path.resolve(CWD, 'assets'),
    };
  };

  let paths = resolveConfigPaths(config);
  const DOCMD_ROOT = path.resolve(__dirname, '..');
  
  const app = express();
  const server = http.createServer(app);
  
  // FIX 1: Declare wss here but do not initialize it yet (prevents EADDRINUSE crash)
  let wss;

  function broadcastReload() {
    if (!wss) return; // Guard against early calls
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  }

  // Inject live reload script
  app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
      const originalSend = res.send;
      res.send = function(body) {
        if (typeof body === 'string' && body.includes('</body>')) {
          const liveReloadScript = `
            <script>
              (function() {
                let socket;
                let reconnectTimer;
                function connect() {
                  socket = new WebSocket('ws://' + window.location.host);
                  socket.onopen = function() {
                    console.log('⚡ docmd live reload connected');
                    if (reconnectTimer) clearInterval(reconnectTimer);
                  };
                  socket.onmessage = function(event) {
                    if (event.data === 'reload') window.location.reload();
                  };
                  socket.onclose = function() {
                    reconnectTimer = setTimeout(connect, 1000);
                  };
                }
                connect();
              })();
            </script>
          `;
          body = body.replace('</body>', `${liveReloadScript}</body>`);
        }
        originalSend.call(this, body);
      };
    }
    next();
  });

  let staticMiddleware = express.static(paths.outputDir);
  app.use((req, res, next) => staticMiddleware(req, res, next));

  // --- 1. Initial Build ---
  console.log(chalk.blue('🚀 Performing initial build...'));
  try {
    await buildSite(configPathOption, { isDev: true, preserve: options.preserve, noDoubleProcessing: true });
  } catch (error) {
      console.error(chalk.red('❌ Initial build failed:'), error.message);
  }

  // --- 2. Setup Watcher & Logs ---
  const userAssetsDirExists = await fs.pathExists(paths.userAssetsDir);
  const watchedPaths = [paths.srcDirToWatch, paths.configFileToWatch];
  if (userAssetsDirExists) watchedPaths.push(paths.userAssetsDir);
  
  if (process.env.DOCMD_DEV === 'true') {
    watchedPaths.push(
      path.join(DOCMD_ROOT, 'templates'),
      path.join(DOCMD_ROOT, 'assets'),
      path.join(DOCMD_ROOT, 'core'),
      path.join(DOCMD_ROOT, 'plugins')
    );
  }
  
  console.log(chalk.dim('\n👀 Watching for changes in:'));
  console.log(chalk.dim(`   - Source: ${chalk.cyan(formatPathForDisplay(paths.srcDirToWatch, CWD))}`));
  console.log(chalk.dim(`   - Config: ${chalk.cyan(formatPathForDisplay(paths.configFileToWatch, CWD))}`));
  if (userAssetsDirExists) {
    console.log(chalk.dim(`   - Assets: ${chalk.cyan(formatPathForDisplay(paths.userAssetsDir, CWD))}`));
  }
  if (process.env.DOCMD_DEV === 'true') {
    console.log(chalk.dim(`   - docmd Internal: ${chalk.magenta(formatPathForDisplay(DOCMD_ROOT, CWD))}`));
  }
  console.log(''); 

  const watcher = chokidar.watch(watchedPaths, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 }
  });

  watcher.on('all', async (event, filePath) => {
    const relativeFilePath = path.relative(CWD, filePath);
    process.stdout.write(chalk.dim(`↻ Change in ${relativeFilePath}... `));
    
    try {
      if (filePath === paths.configFileToWatch) {
        config = await loadConfig(configPathOption);
        const newPaths = resolveConfigPaths(config);
        if (newPaths.outputDir !== paths.outputDir) {
            staticMiddleware = express.static(newPaths.outputDir);
        }
        paths = newPaths;
      }

      await buildSite(configPathOption, { isDev: true, preserve: options.preserve, noDoubleProcessing: true });
      broadcastReload();
      process.stdout.write(chalk.green('Done.\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Rebuild failed:'), error.message);
    }
  });

  // --- 3. Server Startup Logic ---
  const PORT = parseInt(options.port || process.env.PORT || 3000, 10);
  const MAX_PORT_ATTEMPTS = 10;

  // Helper to check if a port is in use without fully starting the main server
  function checkPortInUse(port) {
    return new Promise((resolve) => {
      const tester = http.createServer()
        .once('error', (err) => {
          if (err.code === 'EADDRINUSE') resolve(true);
          else resolve(false);
        })
        .once('listening', () => {
          tester.close(() => resolve(false));
        })
        .listen(port, '0.0.0.0');
    });
  }

  // Helper to ask user for confirmation
  function askUserConfirmation() {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log(chalk.yellow(`\n⚠️  Port ${PORT} is already in use.`));
      console.log(chalk.yellow(`   Another instance of docmd (or another app) might be running.`));
      
      rl.question('   Do you want to start another instance on a different port? (Y/n) ', (answer) => {
        rl.close();
        const isYes = answer.trim().toLowerCase() === 'y' || answer.trim() === '';
        resolve(isYes);
      });
    });
  }
  
  function tryStartServer(port, attempt = 1) {
    // 0.0.0.0 allows network access
    server.listen(port, '0.0.0.0')
      .on('listening', async () => {
        // FIX 1: Initialize WebSocket Server only AFTER successful listen
        wss = new WebSocket.Server({ server });

        const indexHtmlPath = path.join(paths.outputDir, 'index.html');
        const networkIp = getNetworkIp();
        
        const localUrl = `http://127.0.0.1:${port}`;
        const networkUrl = networkIp ? `http://${networkIp}:${port}` : null;

        const border = chalk.gray('────────────────────────────────────────');
        console.log(border);
        console.log(`  ${chalk.bold.green('SERVER RUNNING')}  ${chalk.dim(`(v${require('../../package.json').version})`)}`);
        console.log('');
        console.log(`  ${chalk.bold('Local:')}    ${chalk.cyan(localUrl)}`);
        if (networkUrl) {
            console.log(`  ${chalk.bold('Network:')}  ${chalk.cyan(networkUrl)}`);
        }
        console.log('');
        console.log(`  ${chalk.dim('Serving:')}  ${formatPathForDisplay(paths.outputDir, CWD)}`);
        console.log(border);
        console.log('');

        if (!await fs.pathExists(indexHtmlPath)) {
            console.warn(chalk.yellow(`⚠️  Warning: Root index.html not found.`));
        }
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
          // FIX 1: Close the failed server instance before retrying to ensure clean state
          server.close();
          tryStartServer(port + 1, attempt + 1);
        } else {
          console.error(chalk.red(`Failed to start server: ${err.message}`));
          process.exit(1);
        }
      });
  }

  // FIX 2: Check port status before launching logic
  (async () => {
    // If the user manually specified a port flag (e.g. --port 8080), 
    // we assume they want THAT specific port and skip the check/prompt logic,
    // falling back to standard auto-increment behavior if busy.
    if (options.port) {
      tryStartServer(PORT);
      return;
    }

    const isBusy = await checkPortInUse(PORT);
    
    if (isBusy) {
      const shouldProceed = await askUserConfirmation();
      if (!shouldProceed) {
        console.log(chalk.dim('Cancelled.'));
        process.exit(0);
      }
      // If they said yes, start trying from the NEXT port
      tryStartServer(PORT + 1);
    } else {
      // Port is free, start normally
      tryStartServer(PORT);
    }
  })();

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Shutting down...'));
    watcher.close();
    process.exit(0);
  });
}

module.exports = { startDevServer };