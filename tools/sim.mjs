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
 * sim : consumer simulator for docmd.
 *
 * Three modes (combinable):
 *
 *   --regen-tars        Build monorepo + pack fresh tarballs into <source>/local-tars/.
 *                       Used by `pnpm prep` after tests pass. Does NOT install or run.
 *
 *   --build             Wipe <source>/node_modules, site/, package-lock.json. npm install.
 *                       Then run `docmd build` in source.
 *
 *   --dev               Same as --build, but starts the dev server (long-running).
 *
 * --source=<dir>       Consumer project directory. Defaults to ./_playground if it
 *                       exists in the monorepo, else process.cwd().
 *
 * --skip-monorepo-build  Skip the `pnpm -r run build` step. Use when prep already built.
 *
 * --verbose            Stream every command's output.
 *
 * Tarballs are renamed to versionless names during shipping (e.g.
 * `docmd-core-0.8.16.tgz` -> `docmd-core.tgz`) so consumers can reference
 * `file:local-tars/docmd-core.tgz` and never need to bump on version change.
 *
 * Usage examples:
 *   node tools/sim.mjs --source _playground --regen-tars --skip-monorepo-build
 *   node tools/sim.mjs --source _playground --regen-tars --build
 *   node tools/sim.mjs --source _playground --build
 *   node tools/sim.mjs --source _playground --dev
 *   node tools/sim.mjs --source ./my-docs --build
 *
 * SAFETY:
 *   Tarballs are packed from a /tmp staging copy of each package, never from
 *   the live monorepo working tree. The monorepo is NEVER mutated. Killing
 *   the script mid-run leaves /tmp dirty at most.
 * --------------------------------------------------------------------
 */

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const SOURCE_FLAG = args.find((a) => a.startsWith('--source='));
const SOURCE_DIR = SOURCE_FLAG
  ? path.resolve(SOURCE_FLAG.slice('--source='.length))
  : (fs.existsSync(path.join(MONOREPO_ROOT, '_playground'))
      ? path.join(MONOREPO_ROOT, '_playground')
      : process.cwd());

const REGEN_TARS = args.includes('--regen-tars');
const DO_DEV = args.includes('--dev');
const DO_DOCTOR = args.includes('--doctor');
const EXPLICIT_BUILD = args.includes('--build');
// Default to --build when no mode specified, so `pnpm sim` does the obvious thing.
const DO_BUILD = EXPLICIT_BUILD || (!DO_DEV && !DO_DOCTOR && !REGEN_TARS);

const SKIP_MONOREPO_BUILD = args.includes('--skip-monorepo-build') || args.includes('--skip-build');
const VERBOSE = args.includes('--verbose') || args.includes('--v');

const STAGING_DIR = '/tmp/docmd-sim-staging';
const TARBALL_DIR = path.join(STAGING_DIR, 'tarballs');
const LOCAL_TARS = path.join(SOURCE_DIR, 'local-tars');

const PACKAGE_PREFIX = '@docmd/';

// ── ANSI helpers ─────────────────────────────────────────────────────
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;
const BLUE = (s) => `\x1b[34m${s}\x1b[0m`;
const CYAN = (s) => `\x1b[36m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;

const TAG_WAIT = `${BLUE('[ WAIT ]')}`;
const TAG_DONE = `${GREEN('[ DONE ]')}`;
const TAG_FAIL = `${RED('[ FAIL ]')}`;
const TAG_INFO = `${CYAN('[ INFO ]')}`;
const TAG_WARN = `${YELLOW('[ WARN ]')}`;

function fail(msg, code = 1) {
  console.error(`\n${TAG_FAIL} ${msg}\n`);
  process.exit(code);
}

function step(label, fn) {
  const text = `${label}`;
  process.stdout.write(`${TAG_WAIT} ${text}\n`);
  try {
    const result = fn();
    process.stdout.write(`\x1b[1A\x1b[2K${TAG_DONE} ${text}\n`);
    return result;
  } catch (err) {
    process.stdout.write(`\x1b[1A\x1b[2K${TAG_FAIL} ${text}\n`);
    if (VERBOSE) console.error(err.stderr?.toString() || err.message);
    throw err;
  }
}

function run(cmd, opts = {}) {
  const env = { ...process.env, ...opts.env };
  delete env.npm_config_npm_globalconfig;
  delete env.npm_config_verify_deps_before_run;
  delete env.npm_config__jsr_registry;
  return execSync(cmd, { encoding: 'utf8', stdio: VERBOSE ? 'inherit' : 'pipe', timeout: 180000, ...opts, env });
}

function rmrf(p) {
  if (fs.existsSync(p)) run(`rm -rf "${p}"`);
}

// ── Monorepo build (optional) ───────────────────────────────────────

function buildMonorepo() {
  step('Building monorepo (pnpm -r run build)', () => {
    run('pnpm -r run build', { cwd: MONOREPO_ROOT });
  });
}

// ── Tarball generation ──────────────────────────────────────────────

function collectPackages() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('_') || entry.startsWith('.')) continue;
      const full = path.join(dir, entry);
      const pkgJson = path.join(full, 'package.json');
      if (fs.existsSync(pkgJson)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
        if (pkg.name && pkg.name.startsWith(PACKAGE_PREFIX)) {
          out.push({
            pkgDir: full,
            name: pkg.name,
            version: pkg.version,
            files: Array.isArray(pkg.files) ? pkg.files : ['dist'],
          });
        }
      } else if (fs.statSync(full).isDirectory()) {
        walk(full);
      }
    }
  };
  walk(path.join(MONOREPO_ROOT, 'packages'));
  return out;
}

function packAndShip() {
  const packages = collectPackages();
  const versionMap = Object.fromEntries(packages.map((p) => [p.name, p.version]));

  rmrf(STAGING_DIR);
  fs.mkdirSync(TARBALL_DIR, { recursive: true });

  step(`Copying ${packages.length} packages to staging`, () => {
    for (const pkg of packages) {
      const flat = pkg.name.replace('@', '').replace('/', '-');
      const dest = path.join(STAGING_DIR, 'packages', flat);
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(path.join(pkg.pkgDir, 'package.json'), path.join(dest, 'package.json'));
      for (const entry of pkg.files) {
        const src = path.join(pkg.pkgDir, entry);
        if (!fs.existsSync(src)) continue;
        const target = path.join(dest, entry);
        if (fs.statSync(src).isDirectory()) {
          run(`cp -R "${src}" "${target}"`);
        } else {
          fs.copyFileSync(src, target);
        }
      }
    }
  });

  step('Rewriting workspace:* in staging copies', () => {
    for (const pkg of packages) {
      const flat = pkg.name.replace('@', '').replace('/', '-');
      const pkgJson = path.join(STAGING_DIR, 'packages', flat, 'package.json');
      const data = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
      let changed = false;
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        if (!data[field]) continue;
        for (const dep in data[field]) {
          if (data[field][dep].startsWith('workspace:')) {
            const v = versionMap[dep];
            if (v) { data[field][dep] = `^${v}`; changed = true; }
          }
        }
      }
      if (changed) fs.writeFileSync(pkgJson, JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
  });

  step(`Packing ${packages.length} tarballs`, () => {
    for (const pkg of packages) {
      const flat = pkg.name.replace('@', '').replace('/', '-');
      const pkgDir = path.join(STAGING_DIR, 'packages', flat);
      run(`npm pack --pack-destination "${TARBALL_DIR}"`, { cwd: pkgDir });
    }
  });

  step('Shipping tars into source/local-tars (versionless names)', () => {
    rmrf(LOCAL_TARS);
    fs.mkdirSync(LOCAL_TARS, { recursive: true });
    const versioned = fs.readdirSync(TARBALL_DIR).filter((f) => f.endsWith('.tgz'));
    for (const file of versioned) {
      // Strip the trailing `-<version>` from npm-pack default filename.
      // `docmd-core-0.8.16.tgz` -> `docmd-core.tgz`. Lets the consumer's
      // package.json reference `file:local-tars/docmd-core.tgz` without
      // bumping on every release.
      const versionless = file.replace(/-\d+\.\d+\.\d+(-[\w.]+)?\.tgz$/, '.tgz');
      fs.copyFileSync(path.join(TARBALL_DIR, file), path.join(LOCAL_TARS, versionless));
    }
    const sourceNodeModules = path.join(SOURCE_DIR, 'node_modules');
    if (fs.existsSync(sourceNodeModules)) {
      rmrf(sourceNodeModules);
    }
  });

  step('Cleaning staging', () => rmrf(STAGING_DIR));
}

// ── Install + run in source ─────────────────────────────────────────

function wipeSource() {
  step('Wiping source node_modules/site/lockfile', () => {
    for (const sub of ['node_modules', 'site', 'package-lock.json', '_docmd-search']) {
      const p = path.join(SOURCE_DIR, sub);
      if (fs.existsSync(p)) run(`rm -rf "${p}"`);
    }
  });
}

let restorePkgJson = () => {};

function npmInstall() {
  const pkgJsonPath = path.join(SOURCE_DIR, 'package.json');
  let originalPkgJson = null;
  let didRewrite = false;

  if (fs.existsSync(pkgJsonPath)) {
    try {
      originalPkgJson = fs.readFileSync(pkgJsonPath, 'utf8');
      const data = JSON.parse(originalPkgJson);
      if (!data.dependencies) data.dependencies = {};

      if (fs.existsSync(LOCAL_TARS)) {
        const files = fs.readdirSync(LOCAL_TARS).filter((f) => f.endsWith('.tgz'));
        for (const file of files) {
          const namePart = file.slice(0, -4);
          if (namePart.startsWith('docmd-')) {
            const shortName = namePart.slice('docmd-'.length);
            const pkgName = `${PACKAGE_PREFIX}${shortName}`;
            data.dependencies[pkgName] = `file:local-tars/${file}`;
            didRewrite = true;
          }
        }
      }

      if (didRewrite) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        restorePkgJson = () => {
          try {
            fs.writeFileSync(pkgJsonPath, originalPkgJson, 'utf8');
          } catch {
            // ignore restore failure
          }
        };
      }
    } catch (err) {
      console.warn(`  WARN Failed to temporarily rewrite package.json: ${err.message}`);
    }
  }

  step('npm install (source)', () => {
    run('npm install --no-audit --no-fund', { cwd: SOURCE_DIR });
  });
}

function runDocmd(command) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.npm_config_npm_globalconfig;
    delete env.npm_config_verify_deps_before_run;
    delete env.npm_config__jsr_registry;
    const localBin = path.join(SOURCE_DIR, 'node_modules', '.bin', 'docmd');
    const executable = fs.existsSync(localBin) ? localBin : 'docmd';
    const child = spawn(executable, [command], { cwd: SOURCE_DIR, stdio: 'inherit', env });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docmd ${command} exited ${code}`));
    });
    child.on('error', reject);
  });
}

// ── Main ─────────────────────────────────────────────────────────────

(async function main() {
  // Validate source directory.
  if (!fs.existsSync(path.join(SOURCE_DIR, 'package.json'))) {
    fail(`No package.json in ${SOURCE_DIR}. Pass --source=<consumer-dir>.`, 2);
  }
  // Tars are required for build/dev unless we're regenerating them now.
  if (!REGEN_TARS && !fs.existsSync(LOCAL_TARS)) {
    fail(`${LOCAL_TARS} not found. Run with --regen-tars first to generate tarballs.`, 2);
  }

  const modeLabel = REGEN_TARS && (DO_BUILD || DO_DEV || DO_DOCTOR)
    ? 'regen-tars + ' + (DO_DEV ? 'dev' : DO_DOCTOR ? 'doctor' : 'build')
    : REGEN_TARS ? 'regen-tars' : DO_DEV ? 'dev' : DO_DOCTOR ? 'doctor' : 'build';

  console.log();
  console.log(`  ${BOLD('docmd sim')} ${DIM('— consumer simulator')}`);
  console.log(`  ${DIM('monorepo: ' + MONOREPO_ROOT)}`);
  console.log(`  ${DIM('source:   ' + SOURCE_DIR)}`);
  console.log(`  ${DIM('mode:     ' + modeLabel)}`);
  console.log();

  if (!SKIP_MONOREPO_BUILD) {
    buildMonorepo();
  } else {
    console.log(`  ${DIM('(skipping monorepo build — assuming packages/*/dist/ is current)')}\n`);
  }

  if (REGEN_TARS) packAndShip();

  // Register clean up on exit/SIGINT/SIGTERM to restore package.json
  const cleanup = () => {
    restorePkgJson();
  };
  process.on('exit', cleanup);
  const onSignal = () => {
    cleanup();
    process.exit(0);
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  try {
    if (DO_BUILD || DO_DEV || DO_DOCTOR) {
      wipeSource();
      npmInstall();
      await runDocmd(DO_DEV ? 'dev' : DO_DOCTOR ? 'doctor' : 'build');
    }

    if (REGEN_TARS && !DO_BUILD && !DO_DEV) {
      console.log();
      console.log(`${TAG_DONE} Tarballs written to: ${LOCAL_TARS}`);
      console.log(`${TAG_INFO} Run \`pnpm dev\` or \`pnpm build\` to consume them.\n`);
    } else if (DO_BUILD) {
      console.log();
      console.log(`${TAG_DONE} Consumer build simulation verified.`);
      console.log(`${TAG_INFO} Site output generated at: ${path.join(SOURCE_DIR, 'site')}\n`);
    }
  } finally {
    cleanup();
  }
})().catch((err) => {
  restorePkgJson();
  console.error(`\n${TAG_FAIL} ${err.message}\n`);
  process.exit(1);
});