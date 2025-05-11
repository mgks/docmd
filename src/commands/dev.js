// src/commands/dev.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const { buildSite } = require('./build'); // Re-use the build logic
const { loadConfig } = require('../core/config-loader');

async function startDevServer(configPathOption, options = { preserve: false }) {
  let config = await loadConfig(configPathOption); // Load initial config
  const CWD = process.cwd(); // Current Working Directory where user runs `docmd dev`

  // Function to resolve paths based on current config
  const resolveConfigPaths = (currentConfig) => {
    return {
      outputDir: path.resolve(CWD, currentConfig.outputDir),
      srcDirToWatch: path.resolve(CWD, currentConfig.srcDir),
      configFileToWatch: path.resolve(CWD, configPathOption), // Path to the config file itself
    };
  };

  let paths = resolveConfigPaths(config);

  // docmd's internal templates and assets (for live dev of docmd itself)
  const DOCMD_TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');
  const DOCMD_ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  let wsClients = new Set();
  wss.on('connection', (ws) => {
    wsClients.add(ws);
    // console.log('Client connected to WebSocket. Total clients:', wsClients.size);
    ws.on('close', () => {
      wsClients.delete(ws);
      // console.log('Client disconnected. Total clients:', wsClients.size);
    });
    ws.on('error', (error) => {
        console.error('WebSocket error on client:', error);
    });
  });
  wss.on('error', (error) => {
    console.error('WebSocket Server error:', error);
  });


  function broadcastReload() {
    // console.log('Broadcasting reload to', wsClients.size, 'clients');
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  }

  // Inject live reload script into HTML
  app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
      const originalSend = res.send;
      res.send = function (body) {
        if (typeof body === 'string') {
          const liveReloadScript = `
            <script>
              const socket = new WebSocket(\`ws://\${window.location.host}\`);
              socket.onmessage = function(event) { if (event.data === 'reload') window.location.reload(); };
              socket.onerror = function(error) { console.error('WebSocket Client Error:', error); };
              // socket.onopen = function() { console.log('WebSocket Client Connected'); };
              // socket.onclose = function() { console.log('WebSocket Client Disconnected'); };
            </script>
          `;
          body = body.replace('</body>', `${liveReloadScript}</body>`);
        }
        originalSend.call(this, body);
      };
    }
    next();
  });

  // Serve static files from the output directory
  // This middleware needs to be dynamic if outputDir changes
  let staticMiddleware = express.static(paths.outputDir);
  app.use((req, res, next) => staticMiddleware(req, res, next));

  // Initial build
  console.log('🚀 Performing initial build for dev server...');
  try {
    await buildSite(configPathOption, { isDev: true, preserve: options.preserve }); // Use the original config path option
    console.log('✅ Initial build complete.');
  } catch (error) {
      console.error('❌ Initial build failed:', error.message, error.stack);
      // Optionally, don't start server if initial build fails, or serve a specific error page.
  }


  // Watch for changes
  const watchedPaths = [
    paths.srcDirToWatch,
    paths.configFileToWatch,
    DOCMD_TEMPLATES_DIR,
    DOCMD_ASSETS_DIR
  ];

  console.log(`👀 Watching for changes in:
    - Source: ${paths.srcDirToWatch}
    - Config: ${paths.configFileToWatch}
    - docmd Templates: ${DOCMD_TEMPLATES_DIR} (internal)
    - docmd Assets: ${DOCMD_ASSETS_DIR} (internal)
  `);

  const watcher = chokidar.watch(watchedPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // Don't trigger for initial scan
    awaitWriteFinish: { // Helps with rapid saves or large file writes
        stabilityThreshold: 100,
        pollInterval: 100
    }
  });

  watcher.on('all', async (event, filePath) => {
    const relativeFilePath = path.relative(CWD, filePath);
    console.log(`🔄 Detected ${event} in ${relativeFilePath}. Rebuilding...`);
    try {
      if (filePath === paths.configFileToWatch) {
        console.log('Config file changed. Reloading configuration...');
        config = await loadConfig(configPathOption); // Reload config
        const newPaths = resolveConfigPaths(config);

        // Update watcher if srcDir changed - Chokidar doesn't easily support dynamic path changes after init.
        // For simplicity, we might need to restart the watcher or inform user to restart dev server if srcDir/outputDir change.
        // For now, we'll at least update the static server path.
        if (newPaths.outputDir !== paths.outputDir) {
            console.log(`Output directory changed from ${paths.outputDir} to ${newPaths.outputDir}. Updating static server.`);
            staticMiddleware = express.static(newPaths.outputDir);
        }
        // If srcDirToWatch changes, chokidar won't automatically pick it up.
        // A full dev server restart would be more robust for such config changes.
        // For now, the old srcDir will still be watched.
        paths = newPaths; // Update paths for next build reference
      }

      await buildSite(configPathOption, { isDev: true, preserve: options.preserve }); // Re-build using the potentially updated config path
      broadcastReload();
      console.log('✅ Rebuild complete. Browser should refresh.');
    } catch (error) {
      console.error('❌ Rebuild failed:', error.message, error.stack);
    }
  });

  watcher.on('error', error => console.error(`Watcher error: ${error}`));

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, async () => {
    // Check if index.html exists after initial build
    const indexHtmlPath = path.join(paths.outputDir, 'index.html');
    if (!await fs.pathExists(indexHtmlPath)) {
        console.warn(`⚠️  Warning: ${indexHtmlPath} not found after initial build.
        The dev server is running, but you might see a 404 for the root page.
        Ensure your '${config.srcDir}' directory contains an 'index.md' or your navigation points to existing files.`);
    }
    console.log(`🎉 Dev server started at http://localhost:${PORT}`);
    console.log(`Serving content from: ${paths.outputDir}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down dev server...');
    watcher.close();
    wss.close(() => {
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    });
  });
}

module.exports = { startDevServer };