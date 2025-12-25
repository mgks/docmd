const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bundlePath = path.join(__dirname, '../dist/docmd-wasm.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');

const sandbox = { 
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
};

vm.createContext(sandbox);

console.log('🧪 Testing WASM/Browser bundle...');

try {
    vm.runInContext(bundleCode, sandbox);
    
    if (!sandbox.docmd) {
        throw new Error('docmd global not found in bundle');
    }

    const markdown = '# Hello WASM\nThis is a test.';
    const config = { siteTitle: 'Wasm Test' };
    
    console.log('Compiling markdown...');
    const result = sandbox.docmd.compile(markdown, config);
    
    if (result.includes('<h1>Hello WASM</h1>') && result.includes('Wasm Test')) {
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
