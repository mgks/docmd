const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CWD = process.cwd();
const pkg = require('../package.json');
const CLI_PATH = path.join(CWD, 'bin/docmd.js');

console.log(`🛡️  Running Fail-Safe Test Suite for ${pkg.name} v${pkg.version}...`);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docmd-failsafe-'));

try {
    // Test 1: Project Initialization
    console.log('  [1/3] Testing: docmd init...');
    execSync(`node "${CLI_PATH}" init`, { cwd: tempDir, stdio: 'inherit' });

    // Test 2: Standard Build (The one that crashed v0.3.5)
    console.log('  [2/3] Testing: docmd build...');
    execSync(`node "${CLI_PATH}" build`, { cwd: tempDir, stdio: 'inherit' });

    // Test 3: Standalone Live Build
    console.log('  [3/3] Testing: docmd live (build process)...');
    const liveBuildScript = path.join(CWD, 'scripts/build-live.js');
    execSync(`node "${liveBuildScript}"`, { cwd: CWD, stdio: 'inherit' });

    console.log('\n✅ FAIL-SAFE PASSED: Environment is stable.');
    
} catch (error) {
    console.error('\n❌ FAIL-SAFE CRITICAL FAILURE!');
    console.error(`Reason: ${error.message}`);
    process.exit(1); 
} finally {
    fs.removeSync(tempDir);
    console.log(`🧹 Temp environment scrubbed.`);
}