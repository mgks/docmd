#!/usr/bin/env node
/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * Categorised test runner
 *
 * Replaces the monolithic `scripts/brute-test.js` +
 * `scripts/brute-test-security.js` (now `tests/feature-integration.test.js`
 * and `tests/security.test.js` after the scripts/ → tests/ move)
 * with a set of smaller, focused test files under `tests/`. Each file
 * exports a `test` object (created via `runTestFile()`) and a `results`
 * object with `passed`, `failed`, `failures` getters.
 *
 * The runner:
 *   1. Imports every test file in declared order.
 *   2. For each file, prints a TUI section header (`<emoji>  <name>`).
 *   3. Calls `test.run()` and reads the per-file `results` object to
 *      print pass/fail counts.
 *   4. Aggregates pass/fail across all files into a final summary.
 *   5. Exits 1 if any file failed, 0 otherwise.
 *
 * Wired into `tools/prep.js` (called by `pnpm prep` via the status
 * pipeline) so a single `pnpm prep` runs the entire categorised suite.
 *
 * The legacy feature-integration scenarios (zero-config, i18n,
 * versioning, containers, code blocks, etc.) still run.
 *
 * Run: `node tests/runner.js`
 * Or:  `node tests/runner.js --only=exit-codes,plugin-add-remove` (filter)
 * --------------------------------------------------------------------
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setInterval, clearInterval } from 'node:timers';

process.env.DOCMD_TEST = 'true';

const monorepoRoot = path.resolve(import.meta.dirname, '..');
const siblingDocmdSearch = path.resolve(monorepoRoot, '..', 'docmd-search');
const testPaths = [
  monorepoRoot,
  path.join(monorepoRoot, 'node_modules')
];
if (fs.existsSync(siblingDocmdSearch)) {
  testPaths.push(siblingDocmdSearch);
  testPaths.push(path.join(siblingDocmdSearch, 'node_modules'));
}
process.env.DOCMD_TEST_SEARCH_PATH = testPaths.join(path.delimiter);

const CYAN = (s) => `\x1b[36m${s}\x1b[0m`;
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;

const args = process.argv.slice(2);
const only = (() => {
  const flag = args.find((a) => a.startsWith('--only='));
  if (!flag) return null;
  return flag.slice('--only='.length).split(',').filter(Boolean);
})();

// `tools/verify.js` forwards `--skip-setup` to the runner in CI
// (the install + build steps run before verify). The runner does
// not need any setup work itself, so this is a no-op — we just
// drop it from the arg list so it does not leak into test files
// or show up as an unrecognised flag. Add other verify-only flags
// here as the verify script grows.
const _SKIP_FLAGS = new Set(['--skip-setup']);
for (const f of _SKIP_FLAGS) {
  const i = args.indexOf(f);
  if (i !== -1) args.splice(i, 1);
}

// ---------------------------------------------------------------------------
// Test file registry — order matters.
//   - For in-process tests, the entry is the imported module.
//   - For external tests, the entry has `{ external: true, command, args }`.
//   - When `id` matches the `--only` filter, only those entries run.
// ---------------------------------------------------------------------------

const testFiles = [];

function addInProcess(id, name, module) {
  if (only && !only.includes(id)) return;
  testFiles.push({ id, name, module });
}

function addExternal(id, name, command, args) {
  if (only && !only.includes(id)) return;
  testFiles.push({ id, name, module: { external: true, command, args } });
}

// --- Section 1: CLI contracts (Phase 3 PR 3.A / 3.B / 3.C) -----------------
addInProcess(
  'exit-codes',
  'Exit-code contract (F6, M-12)',
  await import('./cli-contracts/exit-codes.test.js')
);
addInProcess(
  'plugin-add-remove',
  'Plugin add/remove across config formats (F7, M-3)',
  await import('./cli-contracts/plugin-add-remove.test.js')
);
addInProcess(
  'validate-workspace',
  'Validate rewrite + workspace errors + init example (F8, F9, M-1)',
  await import('./cli-contracts/validate-workspace.test.js')
);
addInProcess(
  'deploy',
  'Deploy --force honours overwrite (N-2)',
  await import('./cli-contracts/deploy.test.js')
);
addInProcess(
  'stop',
  'Stop sends SIGTERM and waits for graceful exit (M-11)',
  await import('./cli-contracts/stop.test.js')
);
addInProcess(
  'migrate',
  'Migrate --dry-run is non-destructive (N-3)',
  await import('./cli-contracts/migrate.test.js')
);
addInProcess(
  'offline-links',
  'Offline-mode internal links work in every hosting shape (#167)',
  await import('./cli-contracts/offline-links.test.js')
);
addInProcess(
  'plugin-contract',
  'Plugin contract + public API fixes (Slice C.1 + C.2)',
  await import('./cli-contracts/plugin-contract.test.js')
);
addInProcess(
  'source-tools',
  'Source tools + page shape consistency (Slice C.3)',
  await import('./cli-contracts/source-tools.test.js')
);
addInProcess(
  'i18n',
  'i18n + workspace schema fixes (Slice D — M-6, T-Z6)',
  await import('./cli-contracts/i18n.test.js')
);
addInProcess(
  'llms-and-tui',
  'llms.txt sanitisation + TUI banner options (Slice F — T-Z10, T-Z11, N-13, N-16)',
  await import('./cli-contracts/llms-and-tui.test.js')
);
addInProcess(
  'migrate-fix',
  'Migration polish (Slice E — N-9, N-10, N-22)',
  await import('./cli-contracts/migrate-fix.test.js')
);
addInProcess(
  'plugin-assets-pipeline',
  'Plugin asset pipeline (PAA-1, PAA-2, PAA-3 — async/await + capability)',
  await import('./cli-contracts/plugin-assets-pipeline.test.js')
);
addInProcess(
  'asset-base-url',
  'Asset base-URL + engine-key (URL-1, URL-2 — <base> + KNOWN_KEYS)',
  await import('./cli-contracts/asset-base-url.test.js')
);
addInProcess(
  'url-routing',
  'URL Routing architecture stability (Phase 1, 2, 3)',
  await import('./cli-contracts/url-routing.test.js')
);
addInProcess(
  'runtime-deps',
  'Runtime-deps shared auto-install pipeline (RD-1..RD-CWE, CWE-78 fix)',
  await import('./cli-contracts/runtime-deps.test.js')
);

// --- Section 2: Container parser (Phase 2 PR 1+2+3) ----------------------
addExternal(
  'container-normaliser',
  'Container normaliser (F1–F5)',
  'pnpm',
  ['--filter', '@docmd/parser', 'test']
);

// --- Section 3: Utils (Path / HTML escape) -------------------------------
addExternal(
  'utils',
  'Utils (safePath, escHtml, attrEsc, jsonInject, scriptLiteral)',
  'pnpm',
  ['--filter', '@docmd/utils', 'test']
);

// --- Section 4: Security (Phase 1 CVE suite) ------------------------------
addExternal(
  'security',
  'Security (Phase 1 CVE suite — 88 assertions)',
  'node',
  ['tests/security.test.js']
);

// --- Section 5: Feature integration (legacy feature-integration.test.js) --------------
addExternal(
  'features',
  'Feature integration (29 scenarios — zero-config, i18n, versioning, navigation, search, etc.)',
  'node',
  ['tests/feature-integration.test.js']
);

// --- Section 6: OKF plugin ------------------------------------------------
addExternal(
  'okf-plugin',
  'OKF plugin (Open Knowledge Format bundle generator)',
  'pnpm',
  ['--filter', '@docmd/plugin-okf', 'test']
);

// --- Section 7: LLMS plugin -----------------------------------------------
// The LLMS plugin doesn't have a `pnpm test` script yet, so the runner
// invokes the test runner directly. Default-locale + i18n opt-in tests
// live at packages/plugins/llms/tests/llms.test.js.
addExternal(
  'llms-plugin',
  'LLMS plugin (llms.txt / llms-full.txt / llms.json — default-locale + i18n opt-in)',
  'node',
  ['--test', 'packages/plugins/llms/tests/llms.test.js']
);

// ---------------------------------------------------------------------------
// Runner — execute each entry, print TUI section, aggregate results.
// ---------------------------------------------------------------------------

// Subprocess progress animation. Used only for external test entries (the
// long ones — pnpm-filtered plugin unit tests + the brute-test fixtures).
// In-process tests print their own assertions inline and don't need it.
const PROGRESS_FRAMES = ['█░░░░░░░░░', '▓█░░░░░░░░', '░▓█░░░░░░░', '░░▓█░░░░░░', '░░░▓█░░░░░', '░░░░▓█░░░░', '░░░░░▓█░░░', '░░░░░░▓█░░'];
const PROGRESS_INTERVAL_MS = 150;

function renderProgressBar(elapsedMs) {
  const idx = Math.floor(elapsedMs / 300) % PROGRESS_FRAMES.length;
  const sec = (elapsedMs / 1000).toFixed(1);
  return `${PROGRESS_FRAMES[idx]} ${sec}s`;
}

// Streams subprocess output live to the terminal while buffering it for
// assertion-count parsing and failure-tail replay. Updates a per-section
// progress line on stdout that we clear on completion.
function runExternalWithProgress({ command, args }) {
  return new Promise((resolve) => {
    const startMs = Date.now();
    let outBuf = '';
    let progressLineActive = false;

    // The progress line lives one row under the section header. We write it
    // once, then keep rewriting it in place via \r + clear-line until the
    // child closes. On close, clear it so the section verdict (PASS / FAIL)
    // can claim that visual slot without leaving a stale frame behind.
    const tick = setInterval(() => {
      const bar = renderProgressBar(Date.now() - startMs);
      process.stdout.write(`\r\x1b[2K${DIM(bar)}`);
      progressLineActive = true;
    }, PROGRESS_INTERVAL_MS);

    const child = spawn(command, args, {
      cwd: path.resolve(import.meta.dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8'
    });

    const onChunk = (chunk) => {
      const text = chunk.toString();
      outBuf += text;
      // Live stream to the terminal so the operator sees output as it
      // arrives. If a progress line is currently rendered, drop down
      // one line, print the chunk, then redraw the progress line.
      if (progressLineActive) {
        process.stdout.write(`\x1b[1E\x1b[2K`);
        process.stdout.write(text.replace(/\n(?!$)/g, '\n\x1b[2K'));
        process.stdout.write(`\x1b[1A`);
      } else {
        process.stdout.write(text);
      }
    };
    child.stdout.on('data', onChunk);
    child.stderr.on('data', onChunk);

    child.on('close', (code) => {
      clearInterval(tick);
      // Clear the progress line so the verdict can claim that row.
      if (progressLineActive) process.stdout.write(`\r\x1b[2K`);
      resolve({ status: code ?? 0, output: outBuf });
    });
    child.on('error', (err) => {
      clearInterval(tick);
      if (progressLineActive) process.stdout.write(`\r\x1b[2K`);
      resolve({ status: 1, output: outBuf + '\n' + (err.stack || err.message) });
    });
  });
}

let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];
const startTime = Date.now();

console.log('');
console.log(CYAN(BOLD('Categorised test suite')));
console.log(DIM(`  ${testFiles.length} test file${testFiles.length === 1 ? '' : 's'} • ${new Date().toISOString().slice(0, 10)}`));
console.log('');

(async function main() {
for (const { id, name, module } of testFiles) {
  const sectionStart = Date.now();
  console.log(CYAN(BOLD(name.toUpperCase())));
  console.log('');

  if (module.external) {
    const result = await runExternalWithProgress(module);
    const out = result.output;
    if (result.status === 0) {
      // Parse the assertion count. Two output formats are supported:
      //   1. `tests/feature-integration.test.js` style: "X passed,
      //      Y failed out of Z"
      //   2. `node:test` TAP-style:    "pass N" / "fail N" (one per line)
      let passed = 0;
      let failed = 0;
      const bruteMatch = out.match(/(\d+)\s+passed,\s+(\d+)\s+failed/);
      if (bruteMatch) {
        passed = parseInt(bruteMatch[1], 10);
        failed = parseInt(bruteMatch[2], 10);
      } else {
        const passLines = out.match(/pass\s+(\d+)/g) || [];
        const failLines = out.match(/fail\s+(\d+)/g) || [];
        for (const l of passLines) {
          const v = parseInt(l.replace(/[^\d]/g, ''), 10);
          if (!isNaN(v)) passed = Math.max(passed, v);
        }
        for (const l of failLines) {
          const v = parseInt(l.replace(/[^\d]/g, ''), 10);
          if (!isNaN(v)) failed = Math.max(failed, v);
        }
      }
      totalPassed += passed;
      totalFailed += failed;
      const elapsed = Date.now() - sectionStart;
      console.log(`${GREEN(BOLD('[ PASS ]'))}  ${passed} passed, ${failed} failed  ${DIM('(' + elapsed + 'ms)')}`);
    } else {
      totalFailed += 1;
      allFailures.push({ name, output: out.slice(-2000) });
      const elapsed = Date.now() - sectionStart;
      console.log(`${RED(BOLD('[ FAIL ]'))}  exit code ${result.status}  ${DIM('(' + elapsed + 'ms)')}`);
    }
  } else {
    // In-process runner. The test module's `test.run()` callback prints
    // its own pass/fail per assertion; the module's `results` object
    // reports the aggregate.
    try {
      await module.test.run();
      const passed = module.results.passed;
      const failed = module.results.failed;
      const failures = module.results.failures;
      totalPassed += passed;
      totalFailed += failed;
      for (const f of failures) allFailures.push({ name, output: f });
      const elapsed = Date.now() - sectionStart;
      if (failed === 0) {
        console.log(`${GREEN(BOLD('[ PASS ]'))}  ${passed} passed, 0 failed  ${DIM('(' + elapsed + 'ms)')}`);
      } else {
        console.log(`${RED(BOLD('[ FAIL ]'))}  ${passed} passed, ${failed} failed  ${DIM('(' + elapsed + 'ms)')}`);
      }
    } catch (e) {
      totalFailed += 1;
      allFailures.push({ name, output: e.message + '\n' + e.stack });
      const elapsed = Date.now() - sectionStart;
      console.log(`${RED(BOLD('[ FAIL ]'))}  threw: ${e.message}  ${DIM('(' + elapsed + 'ms)')}`);
    }
  }
  console.log('');
}

const totalMs = Date.now() - startTime;
console.log(CYAN(BOLD('TEST SUMMARY')));
console.log('');
console.log(CYAN(BOLD(`${totalPassed} passed, ${totalFailed} failed across ${testFiles.length} files`)));
console.log(DIM(`Total time: ${totalMs}ms`));
if (allFailures.length > 0) {
  console.log('');
  console.log(RED('Failures:'));
  for (const f of allFailures) {
    console.log(RED(`  - ${f.name}`));
    if (f.output) {
      const snippet = f.output.split('\n').slice(0, 8).join('\n');
      console.log(DIM(snippet));
    }
  }
}
console.log('');

process.exit(totalFailed > 0 ? 1 : 0);
})();