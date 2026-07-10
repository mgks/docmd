// Probe the threads plugin XSS fix. Run from the monorepo root with:
//   node scripts/probe-threads-xss.mjs
import { generateScripts } from '../packages/plugins/threads/dist/index.js';
import fs from 'node:fs/promises';

const tmpDir = '/tmp/xss-verify';
await fs.mkdir(`${tmpDir}/docs/.threads`, { recursive: true });
await fs.writeFile(`${tmpDir}/docs/.threads/authors.json`, JSON.stringify({
  alice: {
    name: 'Alice</script><script>alert("XSS")</script>',
    bio: 'evil\u2028lineTerminator'
  },
  bob: 'not an object'
}));

const orig = process.cwd();
process.chdir(tmpDir);
try {
  const out = generateScripts({ src: 'docs', _activeLocale: { id: 'en' } }, { sidebar: true });
  const html = out.bodyScriptsHtml;
  console.log('--- output ---');
  console.log(html);
  console.log('--- checks ---');
  const checks = {
    // The dangerous form is `</script` (no backslash) terminating a real
    // script block. The HTML parser does NOT see `<\/script` as a close
    // tag, so we need to check for the unescaped form anywhere in the
    // output. Use a regex that matches `</script` only when NOT preceded
    // by a backslash. The trailing `</script>` of the outer wrapping
    // <script>...</script> tag itself is fine — we expect exactly one
    // such occurrence (the closing tag) and it must be the LAST `</script>`
    // in the string.
    'has unescaped </script (preceded by non-backslash)': (() => {
      const matches = html.match(/(?<!\\)<\/script/g) || [];
      // Allow exactly 1 occurrence: the closing tag of the outer script.
      return matches.length === 1;
    })(),
    // The escaped form (scriptLiteral output) must be present.
    'has escaped <\\/script': html.includes('<\\/script'),
    // The authors JSON output must NOT contain raw (unescaped) U+2028/U+2029
    // line terminators. The escape sequence `\\u2028` is the safe form.
    'has no raw U+2028 line terminator': !html.includes('\u2028'),
    'has no raw U+2029 paragraph separator': !html.includes('\u2029'),
    'alice is a stringified object key': html.includes('"alice"')
  };
  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${v ? '\u2713' : '\u2717'} ${k}`);
  }
  const allPass = Object.values(checks).every(v => v);
  console.log(allPass ? '\nALL CHECKS PASS' : '\nFAILURES PRESENT');
  process.exit(allPass ? 0 : 1);
} finally {
  process.chdir(orig);
  await fs.rm(tmpDir, { recursive: true, force: true });
}
