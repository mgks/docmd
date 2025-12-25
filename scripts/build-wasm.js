const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function build() {
    console.log('📦 Building WASM/Browser core...');

    // 1. Generate Templates Module
    const templatesDir = path.join(__dirname, '../src/templates');
    const files = fs.readdirSync(templatesDir);
    const templates = {};

    for (const file of files) {
        if (file.endsWith('.ejs')) {
            const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
            templates[file] = content;
        }
    }

    const templatesJsPath = path.join(__dirname, '../src/wasm/templates.js');
    // Export and set global for the fs-shim
    const templatesJsContent = `
const templates = ${JSON.stringify(templates, null, 2)};
if (typeof globalThis !== 'undefined') globalThis.__DOCMD_TEMPLATES__ = templates;
module.exports = templates;
`;
    fs.writeFileSync(templatesJsPath, templatesJsContent);
    console.log(`✅ Generated src/wasm/templates.js with ${Object.keys(templates).length} templates.`);

    // 2. Bundle using esbuild
    try {
        await esbuild.build({
            entryPoints: [path.join(__dirname, '../src/wasm/core.js')],
            bundle: true,
            outfile: path.join(__dirname, '../dist/docmd-wasm.js'),
            platform: 'browser',
            format: 'iife',
            globalName: 'docmd',
            define: {
                'process.env.NODE_ENV': '"production"'
            },
            banner: {
                js: 'var process = { cwd: () => "/", env: { NODE_ENV: "production" } };',
            },
            inject: [path.join(__dirname, '../src/wasm/shims.js')],
            plugins: [
                {
                    name: 'node-deps-shim',
                    setup(build) {
                        // Redirect fs to custom shim
                        build.onResolve({ filter: /^fs(-extra)?$/ }, args => ({ path: args.path, namespace: 'fs-shim' }));
                        build.onLoad({ filter: /.*/, namespace: 'fs-shim' }, () => ({
                            contents: `
                                module.exports = {
                                    existsSync: (p) => {
                                        // Simple check in global templates
                                        if (!globalThis.__DOCMD_TEMPLATES__) return false;
                                        // Assume p might be absolute or relative, just take basename
                                        // Also handle 'toc' -> 'toc.ejs'
                                        let name = p.split(/[\\/]/).pop();
                                        if (!name.endsWith('.ejs') && !globalThis.__DOCMD_TEMPLATES__[name]) {
                                            name += '.ejs';
                                        }
                                        return !!globalThis.__DOCMD_TEMPLATES__[name];
                                    },
                                    readFileSync: (p, encoding) => {
                                        if (!globalThis.__DOCMD_TEMPLATES__) return '';
                                        let name = p.split(/[\\/]/).pop();
                                        if (!name.endsWith('.ejs') && !globalThis.__DOCMD_TEMPLATES__[name]) {
                                            name += '.ejs';
                                        }
                                        return globalThis.__DOCMD_TEMPLATES__[name] || '';
                                    },
                                    readFile: (p, enc, cb) => {
                                         // Async version shim if needed
                                         if (typeof enc === 'function') cb = enc;
                                         const content = module.exports.readFileSync(p);
                                         if (cb) cb(null, content);
                                         return Promise.resolve(content);
                                    },
                                    statSync: () => ({ isFile: () => true, isDirectory: () => false }),
                                    constants: { F_OK: 0, R_OK: 4 }
                                };
                            `,
                            loader: 'js'
                        }));

                        // Redirect path to simple shim
                        build.onResolve({ filter: /^path$/ }, args => ({ path: args.path, namespace: 'path-shim' }));
                        build.onLoad({ filter: /.*/, namespace: 'path-shim' }, () => ({
                            contents: `
                                module.exports = {
                                    join: (...args) => args.join('/'),
                                    resolve: (...args) => args.join('/'),
                                    basename: (p) => p.split('/').pop(),
                                    dirname: (p) => p.split('/').slice(0, -1).join('/') || '.',
                                    relative: (from, to) => {
                                        return to.replace(from, '').replace(new RegExp('^/'), '');
                                    },
                                    extname: (p) => {
                                        const parts = p.split('.');
                                        return parts.length > 1 ? '.' + parts.pop() : '';
                                    },
                                    isAbsolute: (p) => p.startsWith('/'),
                                    sep: '/'
                                };
                            `,
                            loader: 'js'
                        }));
                    }
                }
            ]
        });
        console.log('✅ Bundled dist/docmd-wasm.js');
    } catch (e) {
        console.error('❌ Build failed:', e);
        process.exit(1);
    }
}

build();
