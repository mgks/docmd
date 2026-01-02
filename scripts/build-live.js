const fs = require('fs-extra');
const path = require('path');
const esbuild = require('esbuild');

async function build() {
    console.log('📦 Building @docmd/live core...');

    const SRC_DIR = path.join(__dirname, '../src');
    const LIVE_SRC_DIR = path.join(SRC_DIR, 'live');
    const DIST_DIR = path.join(__dirname, '../dist');

    // Ensure dist exists and is empty
    fs.emptyDirSync(DIST_DIR);

    // 1. Read Templates
    const templatesDir = path.join(SRC_DIR, 'templates');
    const files = fs.readdirSync(templatesDir);
    const templates = {};

    for (const file of files) {
        if (file.endsWith('.ejs')) {
            templates[file] = fs.readFileSync(path.join(templatesDir, file), 'utf8');
        }
    }

    // 2. Generate templates.js
    const templatesJsPath = path.join(LIVE_SRC_DIR, 'templates.js');
    const templatesContent = `
const templates = ${JSON.stringify(templates, null, 2)};
if (typeof globalThis !== 'undefined') globalThis.__DOCMD_TEMPLATES__ = templates;
module.exports = templates;
`;
    fs.writeFileSync(templatesJsPath, templatesContent);

    // 3. Generate Shim for Buffer
    const shimPath = path.join(LIVE_SRC_DIR, 'shims.js');
    fs.writeFileSync(shimPath, `import { Buffer } from 'buffer'; globalThis.Buffer = Buffer;`);

    // 4. Bundle JS
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
            plugins: [
                {
                    name: 'node-deps-shim',
                    setup(build) {
                        build.onResolve({ filter: /^path$/ }, args => ({ path: args.path, namespace: 'path-shim' }));
                        build.onLoad({ filter: /.*/, namespace: 'path-shim' }, () => ({
                            contents: `
                                module.exports = {
                                    join: (...args) => args.filter(Boolean).join('/'),
                                    resolve: (...args) => '/' + args.filter(Boolean).join('/'),
                                    basename: (p) => p ? p.split(/[\\\\/]/).pop() : '',
                                    dirname: (p) => p ? p.split(/[\\\\/]/).slice(0, -1).join('/') || '.' : '.',
                                    extname: (p) => {
                                        if (!p) return '';
                                        const parts = p.split('.');
                                        return parts.length > 1 ? '.' + parts.pop() : '';
                                    },
                                    isAbsolute: (p) => p.startsWith('/'),
                                    normalize: (p) => p,
                                    sep: '/'
                                };
                            `,
                            loader: 'js'
                        }));

                        build.onResolve({ filter: /^(fs|fs-extra)$/ }, args => ({ path: args.path, namespace: 'fs-shim' }));
                        build.onLoad({ filter: /.*/, namespace: 'fs-shim' }, () => ({
                            contents: `
                                module.exports = {
                                    existsSync: (p) => {
                                        if (!globalThis.__DOCMD_TEMPLATES__) return false;
                                        let name = p.split(/[\\\\/]/).pop(); 
                                        if (globalThis.__DOCMD_TEMPLATES__[name]) return true;
                                        if (!name.endsWith('.ejs') && globalThis.__DOCMD_TEMPLATES__[name + '.ejs']) return true;
                                        return false;
                                    },
                                    readFileSync: (p) => {
                                        if (!globalThis.__DOCMD_TEMPLATES__) return '';
                                        let name = p.split(/[\\\\/]/).pop();
                                        if (globalThis.__DOCMD_TEMPLATES__[name]) return globalThis.__DOCMD_TEMPLATES__[name];
                                        if (!name.endsWith('.ejs')) name += '.ejs';
                                        return globalThis.__DOCMD_TEMPLATES__[name] || '';
                                    },
                                    statSync: () => ({ isFile: () => true, isDirectory: () => false }),
                                    constants: { F_OK: 0, R_OK: 4 }
                                };
                            `, 
                            loader: 'js'
                        }));
                    }
                }
            ]
        });
        console.log('✅ Bundled JS to dist/docmd-live.js');

        // 5. Copy Assets
        console.log('📂 Copying assets...');
        await fs.copy(path.join(SRC_DIR, 'assets'), path.join(DIST_DIR, 'assets'));
        
        // 5.5 Bundle Third-Party Libraries (The FIX)
        // We need to manually copy these from node_modules because they aren't in src/assets
        const copyLibrary = async (packageName, fileToBundle, destFileName) => {
            try {
                // Try to resolve the package path
                let srcPath;
                try {
                    srcPath = require.resolve(`${packageName}/${fileToBundle}`);
                } catch (e) {
                    // Fallback search if require.resolve fails
                    const mainPath = require.resolve(packageName);
                    let currentDir = path.dirname(mainPath);
                    for (let i = 0; i < 5; i++) {
                        if (fs.existsSync(path.join(currentDir, 'package.json'))) break;
                        currentDir = path.dirname(currentDir);
                    }
                    srcPath = path.join(currentDir, fileToBundle);
                }

                if (srcPath && fs.existsSync(srcPath)) {
                    const destPath = path.join(DIST_DIR, 'assets/js', destFileName);
                    await fs.ensureDir(path.dirname(destPath));
                    await fs.copy(srcPath, destPath);
                    console.log(`   └─ Copied ${packageName} -> assets/js/${destFileName}`);
                } else {
                    console.warn(`⚠️ Could not locate ${fileToBundle} in ${packageName}`);
                }
            } catch (e) {
                console.warn(`⚠️ Failed to bundle ${packageName}: ${e.message}`);
            }
        };

        await copyLibrary('minisearch', 'dist/umd/index.js', 'minisearch.js');
        await copyLibrary('mermaid', 'dist/mermaid.min.js', 'mermaid.min.js');
        console.log('✅ Assets & Libraries copied.');

        // 6. Copy Demo HTML
        await fs.copy(path.join(LIVE_SRC_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));
        await fs.copy(path.join(LIVE_SRC_DIR, 'live.css'), path.join(DIST_DIR, 'live.css'));
        console.log('✅ Demo HTML copied.');

    } catch (e) {
        console.error('❌ Build failed:', e);
        process.exit(1);
    }
}

build();