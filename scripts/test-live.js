const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bundlePath = path.join(__dirname, '../dist/docmd-live.js');

if (!fs.existsSync(bundlePath)) {
    console.error('❌ Bundle not found. Run "npm run live" or "node scripts/build-live.js" first.');
    process.exit(1);
}

const bundleCode = fs.readFileSync(bundlePath, 'utf8');

const sandbox = { 
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    window: {},
    self: {},
    globalThis: {}
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);

console.log('🧪 Testing Live Bundle...');

try {
    vm.runInContext(bundleCode, sandbox);
    
    if (!sandbox.docmd) {
        throw new Error('docmd global not found in bundle');
    }

    const markdown = '# Hello Live\nThis is a test.';
    const config = { siteTitle: 'Live Test' };
    
    console.log('Compiling markdown...');
    const result = sandbox.docmd.compile(markdown, config);
    
    if (result.includes('<h1>Hello Live</h1>') && result.includes('Live Test')) {
        console.log('✅ Bundle works! Output contains expected HTML.');
    } else {
        console.error('❌ Bundle produced unexpected output.');
        console.log('Output snippet:', result.substring(0, 200));
        process.exit(1);
    }

} catch (e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
}