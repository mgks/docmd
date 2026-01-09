// Source file from the docmd project — https://github.com/docmd-io/docmd

const fs = require('../core/fs-utils'); // Native wrapper
const path = require('path');
const esbuild = require('esbuild');
const { processAssets } = require('../core/asset-manager');

async function build() {
    console.log('📦 Building @docmd/live core...');

    // Resolve paths relative to src/commands/live.js
    const SRC_DIR = path.resolve(__dirname, '..'); // Points to /src
    const LIVE_SRC_DIR = path.join(SRC_DIR, 'live');
    const DIST_DIR = path.resolve(__dirname, '../../dist'); // Points to /dist in root

    // 1. Clean/Create dist
    if (await fs.exists(DIST_DIR)) {
        await fs.remove(DIST_DIR);
    }
    await fs.ensureDir(DIST_DIR);

    // 2. Generate Shim for Buffer (Browser compatibility)
    const shimPath = path.join(LIVE_SRC_DIR, 'shims.js');
    await fs.writeFile(shimPath, `import { Buffer } from 'buffer'; globalThis.Buffer = Buffer;`);

    // 3. Define the Virtual Template Plugin
    // This reads EJS files from disk and bundles them as a JSON object string
    const templatePlugin = {
        name: 'docmd-templates',
        setup(build) {
            build.onResolve({ filter: /^virtual:docmd-templates$/ }, args => ({
                path: args.path,
                namespace: 'docmd-templates-ns',
            }));

            build.onLoad({ filter: /.*/, namespace: 'docmd-templates-ns' }, async () => {
                const templatesDir = path.join(SRC_DIR, 'templates');
                const files = await fs.readdir(templatesDir);
                const templates = {};

                for (const file of files) {
                    if (file.endsWith('.ejs')) {
                        const content = await fs.readFile(path.join(templatesDir, file), 'utf8');
                        templates[file] = content;
                    }
                }

                return {
                    contents: `module.exports = ${JSON.stringify(templates)};`,
                    loader: 'js',
                };
            });
        },
    };

    // 4. Define Node Modules Shim Plugin
    // Stubs out fs/path requires so the browser bundle doesn't crash
    const nodeShimPlugin = {
        name: 'node-deps-shim',
        setup(build) {
            build.onResolve({ filter: /^(node:)?path$/ }, args => ({ path: args.path, namespace: 'path-shim' }));
            build.onLoad({ filter: /.*/, namespace: 'path-shim' }, () => ({
                contents: `
                    module.exports = {
                        join: (...args) => args.filter(Boolean).join('/'),
                        resolve: (...args) => '/' + args.filter(Boolean).join('/'),
                        basename: (p) => p ? p.split(/[\\\\/]/).pop() : '',
                        dirname: (p) => p ? p.split(/[\\\\/]/).slice(0, -1).join('/') || '.' : '.',
                        extname: (p) => { if (!p) return ''; const parts = p.split('.'); return parts.length > 1 ? '.' + parts.pop() : ''; },
                        isAbsolute: (p) => p.startsWith('/'),
                        normalize: (p) => p,
                        sep: '/'
                    };
                `,
                loader: 'js'
            }));

            build.onResolve({ filter: /^(node:)?fs(\/promises)?|fs-extra$/ }, args => ({ path: args.path, namespace: 'fs-shim' }));
            build.onLoad({ filter: /.*/, namespace: 'fs-shim' }, () => ({
                contents: `
                    module.exports = {
                        existsSync: () => false,
                        readFileSync: () => '',
                        statSync: () => ({ isFile: () => true, isDirectory: () => false }),
                        constants: { F_OK: 0, R_OK: 4 },
                        promises: {}
                    };
                `, 
                loader: 'js'
            }));
        }
    };

    // 5. Bundle JS
    console.log('⚡ Bundling & Compressing JS...');
    try {
        await esbuild.build({
            entryPoints: [path.join(LIVE_SRC_DIR, 'core.js')],
            bundle: true,
            outfile: path.join(DIST_DIR, 'docmd-live.js'),
            platform: 'browser',
            format: 'iife',
            globalName: 'docmd',
            minify: true,
            define: { 'process.env.NODE_ENV': '"production"' },
            inject: [shimPath],
            plugins: [templatePlugin, nodeShimPlugin]
        });

        // 6. Copy & Minify Static Assets using Universal Manager
        console.log('📂 Processing static assets...');
        const assetsSrc = path.join(SRC_DIR, 'assets');
        const assetsDest = path.join(DIST_DIR, 'assets');
        
        if (await fs.exists(assetsSrc)) {
            await processAssets(assetsSrc, assetsDest, { minify: true });
        }

        // 7. Copy HTML Wrapper & Minify Live CSS
        await fs.copy(path.join(LIVE_SRC_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));
        
        const liveCss = await fs.readFile(path.join(LIVE_SRC_DIR, 'live.css'), 'utf8');
        const minifiedLiveCss = await esbuild.transform(liveCss, { loader: 'css', minify: true });
        await fs.writeFile(path.join(DIST_DIR, 'live.css'), minifiedLiveCss.code);

        // 8. Copy Favicon to Root
        const internalFavicon = path.join(assetsSrc, 'favicon.ico');
        if (await fs.exists(internalFavicon)) {
            await fs.copy(internalFavicon, path.join(DIST_DIR, 'favicon.ico'));
        }

        console.log('✅ Live Editor build complete!');

    } catch (e) {
        console.error('❌ Build failed:', e);
        process.exit(1);
    }
}

// Allow direct execution (via scripts/failsafe.js)
if (require.main === module) {
    build();
}

module.exports = { build };