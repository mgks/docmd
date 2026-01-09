// Source file from the docmd project — https://github.com/docmd-io/docmd

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');

const CWD = process.cwd();
const pkg = require('../package.json');
const CLI_PATH = path.join(CWD, 'bin/docmd.js');

console.log(`🛡️  Running Fail-Safe Test Suite for ${pkg.name} v${pkg.version}...`);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docmd-failsafe-'));

try {
    // --- STEP 1: CLI Init ---
    console.log('  [1/4] Testing: docmd init...');
    execSync(`node "${CLI_PATH}" init`, { cwd: tempDir, stdio: 'ignore' });

    // --- STEP 2: CLI Build ---
    console.log('  [2/4] Testing: docmd build...');
    execSync(`node "${CLI_PATH}" build`, { cwd: tempDir, stdio: 'ignore' });

    const indexHtml = path.join(tempDir, 'site', 'index.html');
    if (!fs.existsSync(indexHtml)) {
        throw new Error('Build failed: site/index.html was not generated.');
    }

    // --- STEP 3: Live Build (Generation) ---
    console.log('  [3/4] Testing: docmd live (build process)...');
    
    // Run the internal build script directly to avoid spawning a server
    const liveBuildScript = path.join(CWD, 'src/commands/live.js');
    execSync(`node "${liveBuildScript}"`, { cwd: CWD, stdio: 'ignore' });

    const liveDist = path.join(CWD, 'dist', 'docmd-live.js');
    if (!fs.existsSync(liveDist)) {
        throw new Error('Live build failed: dist/docmd-live.js was not generated.');
    }

    // --- STEP 4: Live Validation (VM Sandbox) ---
    console.log('  [4/4] Validating Live Bundle logic...');
    
    const bundleCode = fs.readFileSync(liveDist, 'utf8');
    
    // Create a mock browser environment
    const sandbox = { 
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        window: {},
        self: {},
        globalThis: {}
    };
    sandbox.window = sandbox; // Self-reference for browser polyfills
    sandbox.self = sandbox;
    sandbox.globalThis = sandbox;

    // Execute the bundle in the sandbox
    vm.createContext(sandbox);
    vm.runInContext(bundleCode, sandbox);

    // Assertions
    if (!sandbox.docmd) {
        throw new Error('Bundle loaded, but "docmd" global was not exposed.');
    }
    if (typeof sandbox.docmd.compile !== 'function') {
        throw new Error('"docmd.compile" function is missing.');
    }

    // Run a real compile test
    const markdown = '# Hello Live\n**Works**';
    const config = { siteTitle: 'Test' };
    const result = sandbox.docmd.compile(markdown, config);

    if (!result.includes('<h1>Hello Live</h1>')) {
        throw new Error('Bundle logic failed: Markdown did not render to HTML.');
    }

    console.log('\n✅ FAIL-SAFE PASSED: Core and Live engine are stable.');
    
} catch (error) {
    console.error('\n❌ FAIL-SAFE CRITICAL FAILURE!');
    console.error(`Reason: ${error.message}`);
    process.exit(1); 
} finally {
    try {
        // Cleanup Temp (Tests 1 & 2)
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        // Cleanup Dist (Tests 3 & 4)
        const distDir = path.join(CWD, 'dist');
        if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true, force: true });
        }
        console.log(`🧹 Environment scrubbed.`);
    } catch (cleanupErr) {
        console.warn('⚠️ Could not cleanup environment:', cleanupErr.message);
    }
}