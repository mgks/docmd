// Source file from the docmd project — https://github.com/docmd-io/docmd

const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('../core/fs-utils');
const chalk = require('chalk');
const os = require('os');
const readline = require('readline');
const { buildSite } = require('./build');
const { loadConfig } = require('../core/config-loader');

// --- 1. Native Static File Server ---
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'font/woff2',
  '.ttf': 'application/font-ttf',
  '.txt': 'text/plain',
};

async function serveStatic(req, res, rootDir) {
  // Normalize path and remove query strings
  let safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '').split('?')[0].split('#')[0];
  if (safePath === '/' || safePath === '\\') safePath = 'index.html';
  
  let filePath = path.join(rootDir, safePath);

  try {
    let stats;
    try {
      stats = await fs.stat(filePath);
    } catch (e) {
      // If direct path fails, try appending .html (clean URLs support)
      if (path.extname(filePath) === '') {
        filePath += '.html';
        stats = await fs.stat(filePath);
      } else {
        throw e;
      }
    }
    
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      await fs.stat(filePath);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await fs.readFile(filePath);

    res.writeHead(200, { 'Content-Type': contentType });
    
    // Inject Live Reload Script into HTML files only
    if (contentType === 'text/html') {
      const htmlStr = content.toString('utf-8');
      const liveReloadScript = `
        <script>
          (function() {
            let socket;
            let retryCount = 0;
            const maxRetries = 50;
            
            function connect() {
              // Avoid connecting if already connected
              if (socket && (socket.readyState === 0 || socket.readyState === 1)) return;

              socket = new WebSocket('ws://' + window.location.host);
              
              socket.onopen = () => {
                console.log('⚡ docmd connected');
                retryCount = 0;
              };
              
              socket.onmessage = (e) => { 
                if(e.data === 'reload') window.location.reload(); 
              };
              
              socket.onclose = () => {
                // Exponential backoff for reconnection
                if (retryCount < maxRetries) {
                    retryCount++;
                    const delay = Math.min(1000 * (1.5 ** retryCount), 5000);
                    setTimeout(connect, delay);
                }
              };
              
              socket.onerror = (err) => {
                 // Ignore errors, let onclose handle retry
              };
            }
            // Delay initial connection slightly to ensure page load
            setTimeout(connect, 500);
          })();
        </script></body>`;
      res.end(htmlStr.replace('</body>', liveReloadScript));
    } else {
      res.end(content);
    }

  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1><p>docmd dev server</p>');
    } else {
      res.writeHead(500);
      res.end(`Server Error: ${err.code}`);
    }
  }
}

// --- 2. Helper Utilities ---

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

// --- 3. Main Dev Function ---

async function startDevServer(configPathOption, options = { preserve: false, port: undefined }) {
  let config = await loadConfig(configPathOption);
  const CWD = process.cwd();

  // Config Fallback Logic
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
  
  // --- Create Native Server ---
  const server = http.createServer((req, res) => {
    serveStatic(req, res, paths.outputDir);
  });
  
  let wss; // WebSocket instance (initialized later)

  function broadcastReload() {
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('reload');
        }
      });
    }
  }

  // --- Initial Build ---
  console.log(chalk.blue('🚀 Performing initial build...'));
  try {
    await buildSite(configPathOption, { isDev: true, preserve: options.preserve, noDoubleProcessing: true });
  } catch (error) {
      console.error(chalk.red('❌ Initial build failed:'), error.message);
  }

  // --- Watcher Setup ---
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
        // Note: With native server, we don't need to restart middleware, 
        // serveStatic reads from disk dynamically on every request.
        paths = resolveConfigPaths(config);
      }

      await buildSite(configPathOption, { isDev: true, preserve: options.preserve, noDoubleProcessing: true });
      broadcastReload();
      process.stdout.write(chalk.green('Done.\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Rebuild failed:'), error.message);
    }
  });

  // --- Server Startup Logic (Port Checking) ---
  const PORT = parseInt(options.port || process.env.PORT || 3000, 10);
  const MAX_PORT_ATTEMPTS = 10;

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
    server.listen(port, '0.0.0.0')
      .on('listening', async () => {
        // Initialize WebSocket Server only AFTER successful listen
        wss = new WebSocket.Server({ server });
        wss.on('error', (e) => console.error('WebSocket Error:', e.message));

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
        if (err.code === 'EADDRINUSE') {
           server.close(); 
           tryStartServer(port + 1);
        } else {
           console.error(chalk.red(`Failed to start server: ${err.message}`));
           process.exit(1);
        }
      });
  }

  // --- Main Execution Flow ---
  (async () => {
    // Skip check if user manually specified port flag
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
      tryStartServer(PORT + 1);
    } else {
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