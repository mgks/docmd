#!/usr/bin/env node
/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
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
 * simulate-consumer : test @docmd/core the way a real user installs it.
 *
 * PROBLEM:
 *   dev:local runs the monorepo binary directly. Node resolves modules
 *   from the monorepo's node_modules, which has EVERY workspace package
 *   symlinked. This masks missing deps, auto-install failures, and
 *   version mismatches. Issues only surface after publishing, when CI
 *   or GitHub Pages deploys fail.
 *
 * SOLUTION:
 *   Create a throwaway project, install @docmd/core the same way a user
 *   would, copy a real config + content set, and run the build. Any
 *   missing-dep, auto-install, or resolution issue fires here, before
 *   the release.
 *
 * USAGE:
 *   Run FROM the consumer project directory (docs/, docmd.io/, your own repo):
 *
 *   node /path/to/docmd/tools/simulate-consumer.mjs                  # npm, temp dir
 *   node /path/to/docmd/tools/simulate-consumer.mjs --local          # monorepo tarballs, temp dir
 *   node /path/to/docmd/tools/simulate-consumer.mjs --local --in-place   # work in consumer dir directly
 *   node /path/to/docmd/tools/simulate-consumer.mjs --local --dev    # live dev server
 *   node /path/to/docmd/tools/simulate-consumer.mjs --local --in-place --dev   # full real-user dev experience
 *   node /path/to/docmd/tools/simulate-consumer.mjs --keep           # keep temp dir for inspection
 *   node /path/to/docmd/tools/simulate-consumer.mjs --no-clean       # in-place: keep existing node_modules
 *   node /path/to/docmd/tools/simulate-consumer.mjs --verbose        # stream all output
 *   node /path/to/docmd/tools/simulate-consumer.mjs --skip-monorepo-build  # assume dist/ is current
 *
 *   Or pass --source explicitly (overrides process.cwd()):
 *   node tools/simulate-consumer.mjs --source ../docs --local
 *
 *   The consumer project is the directory you point at: it must contain
 *   a docmd config (docmd.config.{js,json,mjs}) and the markdown source
 *   the config references.
 *
 * MODES (two independent axes):
 *
 *   Install source:
 *     default  : npm install @docmd/core@latest from the public registry.
 *   --local  : Copy every monorepo package to /tmp staging, resolve
 *              workspace:* refs in the COPIES (monorepo never touched),
 *              pack tarballs from staging. Tests UNRELEASED local changes
 *              with zero risk to the monorepo working tree.
 *
 *   Working directory:
 *     default        : Copy consumer content to a throwaway temp dir
 *                     (/tmp/docmd-consumer-sim-*), install there, build there.
 *                     Cleanest simulation — nothing touches the consumer dir.
 *     --in-place     : Install and run directly in the consumer dir. The
 *                     consumer's package.json, node_modules, and site/ are
 *                    modified exactly as a normal `docmd build` would.
 *                    This is the closest to the real user experience:
 *                    you see site/ appear, node_modules get updated, and
 *                    live changes are reflected in `--dev` mode.
 *     --dev          : Run `docmd dev` (live server) instead of `docmd build`.
 *                    Inherits stdio so you interact with the server normally.
 *                    Best with --in-place: edit your docs and see live
 *                    updates, exactly like a real user.
 *
 * SAFETY:
 *   This is a read-only diagnostic tool. It never commits, never
 *   pushes, never modifies git state, and NEVER mutates the monorepo's
 *   package.json files. The --local mode COPIES each package to a
 *   staging directory under /tmp, rewrites workspace:* refs in the
 *   COPIES only, and packs from there. If the process is killed at
 *   any point (Ctrl+C, crash, power loss), the monorepo is untouched.
 *   Only /tmp is dirty. The only monorepo side-effect is an optional
 *   `pnpm -r run build` (writes gitignored dist/).
 *
 * EXIT CODES:
 *   0 : build succeeded, no missing-dep warnings
 *   1 : build failed OR auto-install warnings appeared
 *   2 : setup error (build failed, pack failed, etc.)
 *   (dev mode: exit code is the server's exit, usually 0 on Ctrl+C)
 * --------------------------------------------------------------------
 */

import { execSync, spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const USE_LOCAL = args.includes('--local');
const IN_PLACE = args.includes('--in-place');
const RUN_DEV = args.includes('--dev');
const KEEP = args.includes('--keep');
const NO_CLEAN = args.includes('--no-clean');
const VERBOSE = args.includes('--verbose') || args.includes('--v');
const SKIP_BUILD = args.includes('--skip-monorepo-build') || args.includes('--skip-build');
const SOURCE_FLAG = args.find((a) => a.startsWith('--source='));
// Default: the directory you ran the tool from. Makes it generic: cd into
// any consumer project (docs/, docmd.io/, your own repo) and point at the
// monorepo tool. No hardcoded path.
const SOURCE_DIR = SOURCE_FLAG
  ? path.resolve(SOURCE_FLAG.slice('--source='.length))
  : path.resolve(process.cwd());

const TMP = path.resolve('/tmp/docmd-consumer-sim-' + Date.now());

// --- ANSI helpers (minimal, no deps) ---
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const CYAN = (s) => `\x1b[36m${s}\x1b[0m`;
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;

function step(label, fn) {
  process.stdout.write(`  ${DIM('WAIT')} ${label}...`);
  try {
    const result = fn();
    process.stdout.write(`\r  ${GREEN('DONE')} ${label}      \n`);
    return result;
  } catch (err) {
    process.stdout.write(`\r  ${RED('FAIL')} ${label}      \n`);
    if (VERBOSE) console.error(err.stderr?.toString() || err.message);
    throw err;
  }
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: VERBOSE ? 'inherit' : 'pipe', timeout: 120000, ...opts });
}

// -----------------------------------------------------------------------
// Step 1: Build the monorepo (needed for --local mode, skipped for npm mode)
// -----------------------------------------------------------------------

function buildMonorepo() {
  step('Building monorepo (pnpm -r run build)', () => {
    run('pnpm -r run build', { cwd: MONOREPO_ROOT });
  });
}

// -----------------------------------------------------------------------
// Step 2a: --local mode — pack all packages into tarballs
//
// SAFETY: This function NEVER mutates the monorepo. Instead of rewriting
// package.json files in place (which risks leaving the monorepo broken
// if the process is killed mid-pack), it COPIES each package to a
// staging directory under /tmp, rewrites the copies, and packs from
// there. If the process is killed at ANY point, the monorepo is
// untouched — only /tmp is dirty.
// -----------------------------------------------------------------------

// Collect all @docmd/* packages under packages/ with their file lists.
// Returns [{ pkgDir, name, version, files }] for every packable package.
function collectMonorepoPackages() {
  const packagesDir = path.join(MONOREPO_ROOT, 'packages');
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const pkgJsonPath = path.join(full, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (pkg.name && pkg.name.startsWith('@docmd/')) {
          out.push({
            pkgDir: full,
            name: pkg.name,
            version: pkg.version,
            files: Array.isArray(pkg.files) ? pkg.files : ['dist'],
          });
        }
      } else if (fs.statSync(full).isDirectory() && !entry.startsWith('_') && !entry.startsWith('.')) {
        walk(full);
      }
    }
  };
  walk(packagesDir);
  return out;
}

// Copy a package to a staging dir, including only the files listed in its
// `files` field (what would go into the tarball) plus package.json itself.
function copyPackageToStaging(pkgInfo, stagingRoot) {
  const { pkgDir, name } = pkgInfo;
  // Scoped name → flatten to a safe directory name.
  const flatName = name.replace('@', '').replace('/', '-');
  const destDir = path.join(stagingRoot, 'packages', flatName);
  fs.mkdirSync(destDir, { recursive: true });

  // Always copy package.json.
  fs.copyFileSync(path.join(pkgDir, 'package.json'), path.join(destDir, 'package.json'));

  // Copy each entry from the `files` field (usually ['dist'] or ['dist','registry']).
  for (const fileEntry of pkgInfo.files) {
    const src = path.join(pkgDir, fileEntry);
    const dest = path.join(destDir, fileEntry);
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        run(`cp -R "${src}" "${dest}"`);
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  }
  return destDir;
}

// Build version map from all collected packages (name → version).
function buildVersionMap(packages) {
  const map = {};
  for (const p of packages) {
    map[p.name] = p.version;
  }
  return map;
}

// Rewrite workspace:* → ^<version> in a SINGLE package.json (the staging copy).
// Uses the version map to resolve cross-package refs.
function rewriteDepsInPackageJson(pkgJsonPath, versionMap) {
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  let changed = false;
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    if (!pkg[field]) continue;
    for (const dep in pkg[field]) {
      if (pkg[field][dep].startsWith('workspace:')) {
        const version = versionMap[dep];
        if (version) {
          pkg[field][dep] = `^${version}`;
          changed = true;
        }
      }
    }
  }
  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
}

function packLocal() {
  const stagingDir = path.join(TMP, '_staging');
  const tarballDir = path.join(stagingDir, 'tarballs');
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.mkdirSync(tarballDir, { recursive: true });

  console.log(DIM(`  staging: ${stagingDir}`));

  const packages = collectMonorepoPackages();
  const versionMap = buildVersionMap(packages);

  const stagedDirs = [];
  step(`Copying ${packages.length} packages to staging (monorepo untouched)`, () => {
    for (const pkgInfo of packages) {
      const stagedDir = copyPackageToStaging(pkgInfo, stagingDir);
      stagedDirs.push(stagedDir);
    }
  });

  step('Resolving workspace:* → ^version (in staging copies only)', () => {
    for (const stagedDir of stagedDirs) {
      const pkgJsonPath = path.join(stagedDir, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        rewriteDepsInPackageJson(pkgJsonPath, versionMap);
      }
    }
  });

  const tarballs = [];
  step('Packing @docmd/* packages into tarballs (from staging)', () => {
    for (const stagedDir of stagedDirs) {
      const pkg = JSON.parse(fs.readFileSync(path.join(stagedDir, 'package.json'), 'utf8'));
      const result = spawnSync('pnpm', ['pack', '--pack-destination', tarballDir], {
        cwd: stagedDir,
        encoding: 'utf8',
      });
      if (result.status === 0) {
        const tgzName = result.stdout.trim().split('\n').pop();
        if (tgzName) tarballs.push(path.join(tarballDir, path.basename(tgzName)));
      } else if (VERBOSE) {
        console.error(`  pack failed for ${pkg.name}: ${result.stderr}`);
      }
    }
  });

  return tarballs;
}

// -----------------------------------------------------------------------
// Step 2b: npm mode — just install from the public registry
// -----------------------------------------------------------------------

function installFromNpm(projectDir) {
  step('Installing @docmd/core from npm', () => {
    run('npm install @docmd/core@latest', { cwd: projectDir });
  });
}

function installFromTarballs(projectDir, tarballs) {
  step(`Installing ${tarballs.length} local tarballs`, () => {
    // Install all local tarballs in one npm install so npm resolves the
    // full dep graph from the tarballs first, then npm for anything else.
    run(`npm install ${tarballs.map((t) => `"${t}"`).join(' ')}`, { cwd: projectDir });
  });
}

// -----------------------------------------------------------------------
// Step 3: Copy consumer content (config + docs)
// -----------------------------------------------------------------------

function copyConsumerContent(projectDir) {
  step(`Copying content from ${path.basename(SOURCE_DIR)}`, () => {
    // Validate: the source dir must look like a docmd consumer project.
    const configCandidates = ['docmd.config.js', 'docmd.config.json', 'docmd.config.mjs', 'docmd.config.ts'];
    const foundConfig = configCandidates.find((c) => fs.existsSync(path.join(SOURCE_DIR, c)));
    if (!foundConfig) {
      throw new Error(
        `No docmd.config.{js,json,mjs,ts} found in ${SOURCE_DIR}. ` +
        `Run this tool from inside a docmd consumer project, or pass --source=<dir>.`,
      );
    }

    // Copy the entire source project, excluding paths that would either
    // pollute the temp project or mask the consumer experience we're
    // trying to simulate. node_modules is the key exclusion: if we copied
    // the consumer's own node_modules we'd inherit whatever they happen to
    // have installed, defeating the point of a clean install.
    const EXCLUDE = new Set([
      'node_modules',
      '.git',
      '.DS_Store',
      'site',           // docmd's default build output
      'dist',           // common alt build output
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
    ]);

    const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDE.has(entry.name)) continue;
      const src = path.join(SOURCE_DIR, entry.name);
      const dest = path.join(projectDir, entry.name);
      if (entry.isDirectory()) {
        run(`cp -R "${src}" "${dest}"`);
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    // Strip @docmd/core from the consumer's package.json so the install
    // step is the only thing that adds it (mimics a fresh user install).
    const consumerPkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(consumerPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(consumerPkgPath, 'utf8'));
      let changed = false;
      for (const field of ['dependencies', 'devDependencies']) {
        if (pkg[field] && pkg[field]['@docmd/core']) {
          delete pkg[field]['@docmd/core'];
          changed = true;
        }
      }
      // Force private so npm doesn't complain about missing fields.
      pkg.private = true;
      if (!pkg.name) pkg.name = 'docmd-consumer-sim';
      if (changed || !pkg.private || !pkg.name) {
        fs.writeFileSync(consumerPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      }
    }
  });
}

// -----------------------------------------------------------------------
// Step 4: Run the build and capture issues
// -----------------------------------------------------------------------

function runBuild(projectDir) {
  let output = '';
  let exitCode = 0;

  process.stdout.write(`  ${DIM('WAIT')} Running docmd build...`);
  try {
    output = run('npx docmd build', { cwd: projectDir, timeout: 120000 });
    process.stdout.write(`\r  ${GREEN('DONE')} Running docmd build      \n`);
  } catch (err) {
    output = (err.stdout || '') + (err.stderr || '');
    exitCode = err.status ?? 1;
    process.stdout.write(`\r  ${RED('FAIL')} Running docmd build      \n`);
  }

  if (VERBOSE || exitCode !== 0) {
    console.log(output);
  }

  return { output, exitCode };
}

// -----------------------------------------------------------------------
// Step 4b: Run the dev server (long-running, inherits stdio)
// -----------------------------------------------------------------------

function runDev(projectDir) {
  // Dev server is long-running: inherit stdio so the user sees live
  // output, can edit docs and watch hot reloads, and Ctrl+C to stop.
  // No timeout, no output capture — this is the real user experience.
  console.log(`  ${CYAN('▶')} Starting docmd dev server in ${DIM(projectDir)}`);
  console.log(`  ${DIM('   Edit your docs and watch live changes. Ctrl+C to stop.')}`);
  console.log('');

  const child = spawn('npx', ['docmd', 'dev'], {
    cwd: projectDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  return new Promise((resolve) => {
    child.on('close', (code) => {
      resolve({ exitCode: code ?? 0 });
    });
    child.on('error', (err) => {
      console.error(RED(`\n  Dev server failed: ${err.message}`));
      resolve({ exitCode: 1 });
    });
    // Propagate Ctrl+C to the child so the user can stop the server.
    process.on('SIGINT', () => child.kill('SIGINT'));
  });
}

// -----------------------------------------------------------------------
// Step 5: Analyse output for issues a real user would hit
// -----------------------------------------------------------------------

function analyseOutput(output, exitCode) {
  const issues = [];

  // Check for missing-dep warnings that auto-install couldn't fix.
  if (/not found in official registry/i.test(output)) {
    issues.push('Plugin/template not in registry — auto-install refused');
  }
  if (/Auto-install of.*failed/i.test(output)) {
    issues.push('Auto-install failed for at least one package');
  }
  if (/Could not load.*after auto-install/i.test(output)) {
    issues.push('Package installed but could not be loaded (exports/ESM issue)');
  }
  if (/pluginLoadErrors|Could not load plugin/i.test(output)) {
    issues.push('Plugin load error — missing or misconfigured');
  }
  if (exitCode !== 0) {
    issues.push(`Build exited with code ${exitCode}`);
  }

  return issues;
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

function cleanup() {
  if (KEEP) {
    console.log(DIM(`\n  Kept: ${TMP}`));
    return;
  }
  try {
    fs.rmSync(TMP, { recursive: true, force: true });
  } catch {
    // intentional: best-effort temp cleanup, never fatal
  }
}

async function main() {
  // Guard: refuse to simulate the monorepo against itself. Running from
  // inside docmd/ would copy the entire monorepo (packages/, scripts/,
  // tests/) into the temp project, which makes no sense and would take
  // forever. The user must point at a CONSUMER project (docs/, docmd.io/,
  // or their own repo).
  if (SOURCE_DIR === MONOREPO_ROOT || SOURCE_DIR.startsWith(MONOREPO_ROOT + path.sep)) {
    console.log('');
    console.log(RED(BOLD('  ✗ Source is inside the docmd monorepo.')));
    console.log(YELLOW(`    SOURCE: ${SOURCE_DIR}`));
    console.log(YELLOW(`    MONOREPO: ${MONOREPO_ROOT}`));
    console.log('');
    console.log(DIM('  This tool simulates a CONSUMER project (docs/, docmd.io/, your repo).'));
    console.log(DIM('  Run it from the consumer directory:'));
    console.log(DIM('    cd ../docs'));
    console.log(DIM('    node ../docmd/tools/simulate-consumer.mjs --local'));
    console.log('');
    process.exit(2);
  }

  console.log('');
  console.log(CYAN(BOLD('docmd consumer simulation')));
  console.log(DIM(`  install: ${USE_LOCAL ? 'local tarballs (unreleased)' : 'npm (published)'}`));
  console.log(DIM(`  workdir: ${IN_PLACE ? 'in-place (' + SOURCE_DIR + ')' : 'temp (' + TMP + ')'}`));
  console.log(DIM(`  command: ${RUN_DEV ? 'dev (live server)' : 'build (one-shot)'}`));
  console.log(DIM(`  source: ${SOURCE_DIR}`));
  console.log('');

  try {
    if (IN_PLACE) {
      await runInPlaceMode();
    } else {
      await runTempMode();
    }
  } catch (err) {
    console.log('');
    console.log(RED(BOLD('  ✗ Simulation setup failed:')));
    console.log(RED(`    ${err.message}`));
    if (VERBOSE && err.stack) console.log(DIM(err.stack));
    cleanup();
    process.exit(2);
  }
}

// -----------------------------------------------------------------------
// Install @docmd/core into a target directory (shared by both modes)
// -----------------------------------------------------------------------

async function installCore(targetDir) {
  if (USE_LOCAL) {
    if (!SKIP_BUILD) {
      buildMonorepo();
    } else {
      console.log(DIM('  (skipping monorepo build — assuming packages/*/dist/ is current)'));
    }
    const tarballs = packLocal();
    installFromTarballs(targetDir, tarballs);
  } else {
    installFromNpm(targetDir);
  }
}

// -----------------------------------------------------------------------
// Mode A: Temp-dir simulation (isolated, clean, CI-like)
// -----------------------------------------------------------------------

async function runTempMode() {
  fs.mkdirSync(TMP, { recursive: true });
  run('npm init -y', { cwd: TMP });

  await installCore(TMP);
  copyConsumerContent(TMP);

  if (RUN_DEV) {
    const { exitCode } = await runDev(TMP);
    cleanup();
    process.exit(exitCode);
  }

  const { output, exitCode } = runBuild(TMP);
  const issues = analyseOutput(output, exitCode);

  console.log('');
  if (issues.length === 0) {
    console.log(GREEN(BOLD('  ✓ No consumer-facing issues detected')));
    console.log(DIM(`    Build succeeded, all deps resolved, no missing-plugin warnings.`));
    console.log(DIM(`    Site output: ${TMP}/site`));
    console.log(DIM(`    Preview with: npx serve ${TMP}/site`));
    cleanup();
    process.exit(0);
  } else {
    console.log(RED(BOLD(`  ✗ ${issues.length} issue(s) a real user would hit:`)));
    for (const issue of issues) {
      console.log(RED(`    - ${issue}`));
    }
    console.log(DIM(`\n  Temp dir preserved: ${TMP}`));
    console.log(DIM('  Re-run with --keep to inspect, or --verbose for full output.'));
    process.exit(1);
  }
}

// -----------------------------------------------------------------------
// Mode B: In-place simulation (works directly in the consumer dir)
//
// This modifies the consumer dir exactly as a normal `docmd build` would:
//   - package.json gets @docmd/core (and auto-installed plugins/templates)
//   - node_modules is created/updated
//   - site/ (or dist/) is created by the build
//
// The user sees everything happen in front of them. To revert:
//   git checkout package.json && rm -rf node_modules site
// -----------------------------------------------------------------------

// Remove stale state from the consumer dir so every sim run starts from
// a clean install. Without this, leftover node_modules from a previous
// sim run or from dev:local mask missing-dep issues — the exact bug we're
// trying to catch. The clean is mandatory in in-place mode unless the
// user passes --no-clean.
function cleanConsumerDir(dir) {
  step('Cleaning stale state (node_modules, lockfiles, site/)', () => {
    const paths = [
      'node_modules',
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'site',
    ];
    for (const rel of paths) {
      const full = path.join(dir, rel);
      if (fs.existsSync(full)) {
        fs.rmSync(full, { recursive: true, force: true });
      }
    }
  });
}

// Reset the consumer's package.json to a known-clean baseline before
// installing. Strips @docmd/* entries (added by auto-install in previous
// runs) and any stale dep references, leaving only the user's own deps.
function resetConsumerPackageJson(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  for (const field of ['dependencies', 'devDependencies']) {
    if (!pkg[field]) continue;
    // Remove any @docmd/* packages that a previous sim auto-installed.
    // The user's real deps (docmd-search, etc.) stay.
    for (const dep of Object.keys(pkg[field])) {
      if (dep.startsWith('@docmd/')) {
        delete pkg[field][dep];
      }
    }
    // Drop the field if it's now empty.
    if (Object.keys(pkg[field]).length === 0) {
      delete pkg[field];
    }
  }

  pkg.private = true;
  if (!pkg.name) pkg.name = 'docmd-consumer-sim';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

async function runInPlaceMode() {
  console.log(YELLOW(`  ⚠ In-place mode: ${SOURCE_DIR} will be modified.`));
  console.log(DIM('    package.json, node_modules, and site/ will change as a normal docmd run.'));
  console.log(DIM('    Revert with: git checkout package.json && rm -rf node_modules site'));
  console.log('');

  // Clean first so every run starts from a real fresh install. This is
  // the whole point of the simulation — if stale node_modules survive
  // from a previous run, the sim can't catch missing-dep issues.
  // Pass --no-clean to skip (useful for rapid iteration where you only
  // changed markdown content and want to keep the install step fast).
  if (!NO_CLEAN) {
    cleanConsumerDir(SOURCE_DIR);
    resetConsumerPackageJson(SOURCE_DIR);
  } else {
    console.log(DIM('  (--no-clean: keeping existing node_modules and package.json)'));
  }

  await installCore(SOURCE_DIR);

  if (RUN_DEV) {
    const { exitCode } = await runDev(SOURCE_DIR);
    process.exit(exitCode);
  }

  const { output, exitCode } = runBuild(SOURCE_DIR);
  const issues = analyseOutput(output, exitCode);

  console.log('');
  if (issues.length === 0) {
    console.log(GREEN(BOLD('  ✓ Build completed in-place, no consumer-facing issues.')));
    console.log(DIM(`    site/ is ready in ${SOURCE_DIR}`));
    process.exit(0);
  } else {
    console.log(RED(BOLD(`  ✗ ${issues.length} issue(s) a real user would hit:`)));
    for (const issue of issues) {
      console.log(RED(`    - ${issue}`));
    }
    process.exit(1);
  }
}

main();
