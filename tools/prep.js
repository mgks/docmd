/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation generator.
 *
 * @package     @docmd/core (and ecosystem)
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 *
 * Release preparation pipeline. Runs the full dev suite in five
 * clear category sections:
 *
 *   1. Setup       - stop running servers, wipe global binaries,
 *                    clean the monorepo
 *   2. Lint        - eslint over the entire repo, summarised
 *   3. Build       - pnpm install + pnpm -r run build, so the
 *                    test sections have dist files to run
 *                    against (clean wipes dist, this rebuilds it)
 *   4. Docker      - optional Docker availability check
 *   5. Tests       - categorised test suite (tests/runner.js,
 *                    365+ assertions covering Phase 1 security
 *                    CVEs + Phase 2 container parser + Phase 3
 *                    CLI contracts + OKF/LLMS plugin tests +
 *                    Mega Integration Test for workspaces,
 *                    i18n, versioning, and plugin combinations)
 *                    followed by per-package unit tests
 *                    (parser, utils, mermaid, okf) via
 *                    `pnpm -r run test --if-present` so a local
 *                    regression fails the release pipeline
 *   6. Link        - optional global npm link
 *
 * Each step inside a section shows [WAIT] (dim) when it starts
 * and [DONE] (green) when it finishes. No emojis.
 *
 * Default output is intentionally minimal: every step collapses to
 * one line, and every count (passed tests, lint errors, package
 * totals, Docker version, ...) accumulates into a single trailing
 * Summary block at the end of the pipeline. A fully-green run prints
 * a green `┌─ Summary` listing each section with its stat; a run
 * with any failure replaces that block with a red `┌─ Issues` listing
 * every failure with file:line detail.
 *
 * Pass --verbose (or --full) to stream the full test output as the
 * suite runs — useful when actively iterating on a test that just
 * started failing and you want to see the assertion text inline.
 *
 * Run:  pnpm prep
 *       pnpm prep --link            (skip tests, install globally)
 *       pnpm prep --skip-tests      (skip both test suites)
 *       pnpm prep --only=exit-codes (run a single test section)
 *       pnpm prep --verbose         (stream full test output inline)
 *       pnpm prep --full            (alias for --verbose)
 * --------------------------------------------------------------------
 */

const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);

// --verbose / --full streams every step's raw output as it runs.
// Default mode keeps the pipeline minimal: each step collapses to
// one line and a final Issues section appears only if something failed.
const verbose = args.includes('--verbose') || args.includes('--full');

// Issue accumulator — populated by every section so a single trailing
// "Issues" block can show the operator everything that needs fixing.
const issues = [];
function addIssue(severity, section, message, details = []) {
    issues.push({ severity, section, message, details });
}

// Stat accumulator — every section contributes a one-line entry that
// prints in the trailing Summary block. Lets the per-step line stay
// minimal ("[ DONE ] 28s") while still surfacing the actual numbers
// (passed counts, lint counts, etc.) at the end.
const stats = [];
function addStat(label, value, severity = 'ok') {
    stats.push({ label, value, severity });
}

// ── TUI design tokens (no emojis, only [WAIT] / [DONE] / [ FAIL ]) ──
const C = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    dim:    '\x1b[2m',
    blue:   '\x1b[34m',
    cyan:   '\x1b[36m',
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m'
};

// ── TUI primitives ────────────────────────────────────────────────────
// section() and footer() pair up to produce exactly one blank line
// between groups: footer ends with \n, section starts without \n.
function section(label, color) {
    console.log(`${color}${C.bold}┌─ ${label}${C.reset}`);
}

function footer(color) {
    console.log(`${color}└${'─'.repeat(50)}${C.reset}`);
}

function startStep(label) {
    // Print the [WAIT] sign and return a handle to update on completion.
    const bar = `${C.cyan}│${C.reset}`;
    const text = `${C.dim}${label}${C.reset}`;
    process.stdout.write(`${bar}  ${text.padEnd(52)}${C.dim}[ WAIT ]${C.reset}\n`);
    return { label, startMs: Date.now(), bar, text };
}

function finishStep(s, status, summary) {
    // Rewrite the same line with [DONE] / [ WARN ] / [ FAIL ] + elapsed time.
    // Default status is 'done' — the common case.
    const effectiveStatus = status || 'done';
    const ms = Date.now() - s.startMs;
    const t = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    const tag = effectiveStatus === 'done'
        ? `${C.green}[ DONE ]${C.reset}`
        : effectiveStatus === 'warn'
            ? `${C.yellow}[ WARN ]${C.reset}`
            : `${C.red}[ FAIL ]${C.reset}`;
    const sumTxt = summary ? `  ${C.dim}${summary}${C.reset}` : '';
    // Move cursor up 1 line, clear it, rewrite.
    process.stdout.write('\x1b[1A\x1b[2K');
    process.stdout.write(
        `${s.bar}  ${s.text.padEnd(52)}${tag} ${C.dim}${t}${C.reset}${sumTxt}\n`
    );
}

// Same shape as finishStep() but prints a FRESH line below the streamed
// content instead of rewriting the [WAIT] line via cursor-up. Use this
// for steps whose child process has written lines of its own between
// startStep() and now, because the cursor is no longer on the WAIT
// line — finishStep()'s `\x1b[1A` would clobber an unrelated output line.
function writeVerdictLine(s, status, summary) {
    const ms = Date.now() - s.startMs;
    const t = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    const tag = status === 'done'
        ? `${C.green}[ DONE ]${C.reset}`
        : `${C.red}[ FAIL ]${C.reset}`;
    console.log(`${s.bar}  ${s.text.padEnd(52)}${tag} ${C.dim}${t}${C.reset}  ${C.dim}${summary}${C.reset}`);
}

function run(cmd, opts = {}) {
    // opts.silent   — when true (default), suppress output unless cmd failed.
    // opts.capture  — return stdout/stderr as strings; never stream to the TUI.
    //                 Used by collapsed-mode test steps so we can parse a
    //                 summary line instead of dumping hundreds of test logs.
    // The function never calls process.exit; callers inspect `result.ok`.
    const silent  = opts.silent  !== false;
    const capture = opts.capture === true;
    try {
        const out = execSync(cmd, {
            stdio: capture
                ? ['ignore', 'pipe', 'pipe']
                : (silent ? 'ignore' : 'inherit'),
            maxBuffer: 64 * 1024 * 1024,
        });
        return {
            ok: true,
            stdout: capture ? out.toString() : '',
            stderr: '',
            status: 0,
        };
    } catch (e) {
        return {
            ok: false,
            stdout: capture ? (e.stdout ? e.stdout.toString() : '') : '',
            stderr: capture ? (e.stderr ? e.stderr.toString() : '') : '',
            status: e.status,
        };
    }
}

// ── Step helpers ──────────────────────────────────────────────────────
function deepWipe() {
    const bins = ['docmd', 'docmd-live'];
    for (const bin of bins) {
        try {
            const paths = execSync(`which -a ${bin}`, { stdio: 'pipe' })
                .toString().split('\n').filter(Boolean);
            for (const p of paths) {
                try { if (fs.existsSync(p)) fs.unlinkSync(p); }
                catch {
                    try { execSync(`rm -f "${p}"`, { stdio: 'ignore' }); } catch { /* ignore */ }
                }
            }
        } catch { /* ignore which failure */ }
    }
}

function runLint() {
    const s = startStep('Running eslint over monorepo');
    // eslint exits non-zero on errors — JSON is still on stdout. run()
    // never exits the process, so we can collect the lint output cleanly.
    const result = run('pnpm -s exec eslint . --format json', { capture: true });

    let errors = 0, warnings = 0;
    const details = [];
    try {
        const results = JSON.parse(result.stdout || '[]');
        for (const file of results) {
            for (const msg of file.messages || []) {
                if (msg.severity === 2) errors++;
                else if (msg.severity === 1) warnings++;
                if (msg.severity >= 1) {
                    const relPath = (file.filePath || '')
                        .replace(process.cwd() + '/', '')
                        .replace(/^.*\/docmd\//, '');
                    details.push(`${relPath}:${msg.line} — ${msg.message}`);
                }
            }
        }
    } catch (_) { /* malformed output */ }

    const status = errors > 0 ? 'fail' : (warnings > 0 ? 'warn' : 'done');
    finishStep(s, status);

    const summary = `${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`;
    addStat('Lint', summary, errors > 0 ? 'fail' : (warnings > 0 ? 'warn' : 'ok'));

    if (errors > 0) addIssue('error', 'Lint', `${errors} lint error(s)`, details);
    else if (warnings > 0) addIssue('warning', 'Lint', `${warnings} lint warning(s)`, details);
}

function runTestStep(label, cmd, statLabel = label) {
    const s = startStep(label);

    // Verbose mode: stream the raw output as before. The finish line
    // rewrites with [DONE] / [FAIL] depending on the exit code.
    if (verbose) {
        const result = run(cmd, { silent: false });
        if (result.ok) finishStep(s);
        else {
            finishStep(s, 'fail');
            addIssue('error', label, 'test step failed', []);
        }
        addStat(statLabel, result.ok ? 'passed (see --verbose output for details)' : 'failed', result.ok ? 'ok' : 'fail');
        return;
    }

    // Default (collapsed) mode: STREAM LIVE so the operator sees the
    // runner's own per-section TUI (each `┌─ <name>` is a new section
    // starting, each `[ PASS ]` / `[ FAIL ]` is a section finishing).
    // Previously this branch captured stdout into a buffer and printed a
    // single summary line at the end — useful for clean logs but useless
    // when a multi-minute test suite looks completely silent. Inheriting
    // stdio lets the runner talk to the operator directly; the runner's
    // own `Test summary: N passed, M failed across K files` line (printed
    // inline at the end of its run) is now the canonical counts source.
    // The cursor is no longer on the WAIT line after streaming, so we use
    // writeVerdictLine() to print a fresh verdict line BELOW the streamed
    // content instead of trying to rewrite the WAIT line in place.
    let exitCode = 0;
    try {
        execSync(cmd, { stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
        exitCode = e.status ?? 1;
    }

    if (exitCode === 0) {
        writeVerdictLine(s, 'done', 'all sections passed — see runner summary above');
        addStat(statLabel, 'passed (see runner output for counts)', 'ok');
    } else {
        const statusLine = `runner exited with status ${exitCode}`;
        writeVerdictLine(s, 'fail', statusLine);
        addStat(statLabel, `failed (exit ${exitCode})`, 'fail');
        addIssue('error', label, 'test command failed', [
            statusLine,
            're-run with --verbose to see the full failure output inline',
        ]);
    }
}

// ── Final Summary / Issues section ───────────────────────────────────
// Single trailing block. When nothing failed, it renders as a green
// Summary listing every stat (one line per section). When issues were
// collected, it flips to a red Issues block with the same group /
// bullet layout used elsewhere in the TUI. Either way it lives in the
// same slot at the end of the pipeline, so the operator always knows
// where to look for the verdict.
function printSummary() {
    if (issues.length === 0) {
        // Green Summary — every stat in one tidy list. Pad the label
        // column to the longest label so values align regardless of
        // how many sections contributed.
        section('Summary', C.green);
        const pad = Math.max(...stats.map(s => s.label.length)) + 2;
        for (const s of stats) {
            const tag = s.severity === 'warn'
                ? `${C.yellow}[ WARN ]${C.reset}`
                : `${C.green}[ DONE ]${C.reset}`;
            const label = `${s.label}`.padEnd(pad);
            console.log(`${C.green}│${C.reset}  ${tag} ${C.bold}${label}${C.reset}${s.value}`);
        }
        footer(C.green);
        return;
    }

    // Failure case: render the Issues block.
    const errors   = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const color    = errors > 0 ? C.red : C.yellow;
    const head     = `Issues — ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`;
    section(head, color);

    // Group by section so two issues from the same source don't repeat
    // the section header; the operator reads the section once and then
    // scans the bullets.
    const bySection = new Map();
    for (const i of issues) {
        if (!bySection.has(i.section)) bySection.set(i.section, []);
        bySection.get(i.section).push(i);
    }
    for (const [name, items] of bySection) {
        const tag = items.some(i => i.severity === 'error')
            ? `${C.red}[ FAIL ]${C.reset}`
            : `${C.yellow}[ WARN ]${C.reset}`;
        console.log(`${color}│${C.reset}  ${tag} ${C.bold}${name}${C.reset}`);
        for (const item of items) {
            console.log(`${color}│${C.reset}    ${item.message}`);
            const detailCap = 8;
            for (const detail of item.details.slice(0, detailCap)) {
                console.log(`${color}│${C.reset}      ${C.dim}${detail}${C.reset}`);
            }
            if (item.details.length > detailCap) {
                console.log(`${color}│${C.reset}      ${C.dim}… ${item.details.length - detailCap} more (re-run with --verbose for full output)${C.reset}`);
            }
        }
    }
    footer(color);
}

function runDockerCheck() {
    const s = startStep('Checking Docker availability');
    let hasDocker = '';
    try {
        hasDocker = execSync('which docker 2>/dev/null', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
    } catch { /* not installed */ }

    if (!hasDocker && !process.env.DOCKER_HOST) {
        finishStep(s, 'warn');
        addStat('Docker', 'not installed — skipped', 'warn');
        return;
    }
    try {
        const version = execSync('docker --version', { encoding: 'utf8', stdio: ['pipe', 'pipe'] }).trim();
        finishStep(s, 'done');
        addStat('Docker', version.replace('Docker version ', 'Docker '), 'ok');
    } catch {
        finishStep(s, 'warn');
        addStat('Docker', 'binary not functional', 'warn');
    }
}

// ── Main pipeline ────────────────────────────────────────────────────

// Header — banner + "Maintenance Pipeline" subtitle. Inlined here
// (rather than calling `node tools/status.js start:reset`) because
// that helper opens a section frame which we don't want prep.js
// to inherit. prep.js owns its own section boundaries.
const LOGO = '\n'
    + '    _                 _ \n'
    + '  _| |___ ___ _____ _| |\n'
    + ' | . | . |  _|     | . |\n'
    + ' |___|___|___|_|_|_|___|\n';
console.log(`${C.blue}${LOGO}${C.reset}`);
console.log(`${C.dim} Monorepo Maintenance Pipeline ${C.reset}\n`);

// Section 1: Setup
section('Setup', C.blue);
{
    const s = startStep('Stopping active servers');
    const r = run('pnpm -s stop');
    if (r.ok) finishStep(s);
    else { finishStep(s, 'fail', `exit ${r.status}`); addIssue('error', 'Setup', `pnpm stop failed (exit ${r.status})`, []); }
}
{
    const s = startStep('Wiping global docmd binaries');
    const pkgs = ['@docmd/core', '@docmd/monorepo', 'docmd', 'docmd-live'];
    for (const pkg of pkgs) {
        try { execSync('npm uninstall -g ' + pkg + ' -s', { stdio: 'ignore' }); } catch { /* ignore */ }
        try { execSync('pnpm uninstall -g ' + pkg + ' -s', { stdio: 'ignore' }); } catch { /* ignore */ }
    }
    deepWipe();
    finishStep(s);
}
{
    const s = startStep('Cleaning monorepo');
    const r = run('pnpm -s clean');
    if (r.ok) finishStep(s);
    else { finishStep(s, 'fail', `exit ${r.status}`); addIssue('error', 'Setup', `pnpm clean failed (exit ${r.status})`, []); }
}
{
    // pnpm clean wipes node_modules; reinstall before lint so the eslint
    // binary is on PATH. Without this step the lint section silently exits
    // 0 with no output because `pnpm exec eslint` can't find the binary.
    const s = startStep('Installing monorepo dependencies');
    const r = run('pnpm install --frozen-lockfile');
    if (r.ok) finishStep(s);
    else { finishStep(s, 'fail', `exit ${r.status}`); addIssue('error', 'Setup', `pnpm install failed (exit ${r.status})`, []); }
}
addStat('Setup', 'cleaned + installed dependencies', 'ok');
footer(C.blue);

// Section 2: Lint — runs after Setup reinstalls deps so eslint is available.
section('Lint', C.cyan);
runLint();
footer(C.cyan);

// Section 3: Build — required so tests have dist files to run against.
// `pnpm clean` (called in Setup) wipes every package's dist directory;
// deps are already restored by Setup's install step.
section('Build', C.cyan);
{
    const s = startStep('Building all packages (pnpm -r run build)');
    const r = run('pnpm -r run build');
    if (r.ok) finishStep(s);
    else { finishStep(s, 'fail', `exit ${r.status}`); addIssue('error', 'Build', `pnpm -r run build failed (exit ${r.status})`, []); }
}
addStat('Build', 'built all packages', 'ok');
footer(C.cyan);

// Section 4: Docker (optional)
section('Docker', C.blue);
runDockerCheck();
footer(C.blue);

// Section 5: Tests
section('Tests', C.blue);
if (args.includes('--skip-tests')) {
    const s = startStep('Skipping test suite (--skip-tests)');
    finishStep(s, 'done');
    addStat('Tests', 'skipped by user request', 'ok');
} else {
    const only = args.find((a) => a.startsWith('--only='));
    const runnerArgs = only ? ' ' + only : '';
    // The categorised runner now includes the Mega Integration Test
    // (workspaces + i18n + versioning + plugins), which used to live
    // in `tests/failsafe.test.mjs`. The old failsafe was removed because
    // it duplicated Setup / Build work that `pnpm prep` already does.
    // runTestStep() collapses to a one-line summary by default; pass
    // --verbose to stream the full output.
    // The shortLabel is what shows in the Summary block; the longer
    // stepLabel stays in the per-step line.
    runTestStep('Categorised test suite (tests/runner.js)',
        'node tests/runner.js' + runnerArgs, 'Tests · runner.js');

    // Per-package unit tests (parser, utils, mermaid, okf). Packages
    // without a `test` script are skipped by `--if-present`. Wired in
    // here so a regression in any plugin's local suite fails the
    // release pipeline just like a regression in tests/runner.js.
    runTestStep('Per-package unit tests (pnpm -r run test)',
        'pnpm -r run test --if-present', 'Tests · per-package units');
}
footer(C.blue);

// Section 6: Link (optional)
if (args.includes('--link')) {
    section('Link', C.blue);
    const s = startStep('Linking @docmd/core globally');
    try {
        execSync('npm link --silent', {
            cwd: require('path').join(process.cwd(), 'packages/core'),
            stdio: 'ignore'
        });
        finishStep(s, 'done', 'docmd command available globally');
    } catch {
        finishStep(s, 'fail', 'npm link failed');
        addIssue('error', 'Link', 'npm link failed', []);
    }
    footer(C.blue);
}

// Section 7: Summary / Issues — single trailing block. Renders a
// green Summary on a clean run, or a red Issues block on failure.
// Either way it lives in the same slot at the end of the pipeline
// so the operator always knows where to look for the verdict.
printSummary();

// Exit code: any error-level issue is fatal. Warnings alone keep the
// pipeline green so the operator can decide whether to act on them.
const hasErrors = issues.some(i => i.severity === 'error');
if (hasErrors) process.exit(1);