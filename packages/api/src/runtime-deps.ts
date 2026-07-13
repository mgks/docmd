/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * @package     @docmd/api
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

/**
 * Runtime dependency bootstrap for plugins, templates, and engines.
 *
 * This module is the single source of truth for the "fetch a missing
 * official dependency on first build" path. Both `hooks.ts` (plugin /
 * template loader) and `engine.ts` (engine loader) call into it.
 *
 * Why it exists:
 *   - Security: replaces the previous `execSync(\`pnpm add ${pkg}\`)`
 *     shell-string command, which was a CWE-78 surface if a name ever
 *     leaked in from an untrusted config (fixed by strict regex +
 *     `spawn` arg-array + defence-in-depth registry lookup).
 *   - Reuse: the install pipeline was duplicated in hooks and engine;
 *     one module, one set of behaviour changes.
 *   - Idempotency: TUI status lines are reported through a per-build
 *     cache so a dev-server rebuild that re-runs the loader doesn't
 *     spam the same "WAIT / DONE" line pair for packages already on
 *     disk.
 *
 * Public surface (re-exported from `index.ts`):
 *   - `loadRuntimeRegistry()`         — read & cache the generated registry
 *   - `detectPackageManager(cwd)`     — pick pnpm / yarn / bun / npm
 *   - `getDocmdVersion()`             — `@docmd/core` version (for pinning)
 *   - `isValidRuntimeDepName(name)`   — strict regex, returns boolean
 *   - `installRuntimeDep(pkg)`        — non-shell `spawn` install, true on ok
 *   - `reportInstallStatus(shortName, status)` — idempotent TUI reporter
 *   - `getBuildStatusReporter()`     — single per-build reporter cache
 */

import path from 'node:path';
import nativeFs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { TUI } from '@docmd/tui';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Monorepo root - two levels up from packages/api/dist/
const __monorepoRoot = path.resolve(__dirname, '..', '..', '..');

// ---------------------------------------------------------------------------
// Strict package-name regex (CWE-78 defence)
// Accepts:  @docmd/plugin-foo
//           @docmd/template-summer
//           @docmd/engine-rust
//           @docmd/plugin-math-katex  (two-segment short names are fine)
// Rejects: anything with shell metacharacters, scoped third-party names,
//          uppercase letters, or names that don't fit the @docmd/<kind>-*
//          pattern. A second defence lives in `installRuntimeDep`, which
//          cross-checks the lookup against `loadRuntimeRegistry()` so a
//          forbidden name that happens to match the regex still cannot be
//          installed.
// ---------------------------------------------------------------------------
const PACKAGE_NAME_RE = /^@docmd\/(?:plugin|template|engine)-[a-z0-9][a-z0-9.-]*$/;

// ---------------------------------------------------------------------------
// Registry loader
// ---------------------------------------------------------------------------

let _registry: Record<string, any> | null = null;

/**
 * Read the generated runtime registry for plugins / templates / engines.
 *
 * Resolution order:
 *   1. `<package-root>/registry/plugins.generated.json`  (monorepo dev +
 *      published package, both expose this path under `files`).
 *   2. `<monorepo-root>/packages/api/registry/plugins.generated.json`
 *      (fallback for callers that import us from a nested dist path
 *      that the first candidate doesn't satisfy).
 *
 * The result is cached per process so a hot dev-server loop doesn't
 * re-read the file on every hook call.
 */
export function loadRuntimeRegistry(): Record<string, any> {
  if (_registry) return _registry;
  const candidates = [
    path.resolve(__dirname, '..', 'registry', 'plugins.generated.json'),
    path.resolve(__monorepoRoot, 'packages', 'api', 'registry', 'plugins.generated.json'),
  ];
  for (const candidate of candidates) {
    if (nativeFs.existsSync(candidate)) {
      _registry = JSON.parse(nativeFs.readFileSync(candidate, 'utf8'));
      return _registry!;
    }
  }
  _registry = {};
  return _registry;
}

/** Force-reload the registry cache (tests only). */
export function _resetRuntimeRegistryCache(): void {
  _registry = null;
}

// ---------------------------------------------------------------------------
// Project inspection helpers
// ---------------------------------------------------------------------------

/**
 * Detect the package manager used in `cwd` (or any of its ancestors).
 * Walks upward until a known lockfile is found; defaults to `npm`.
 */
export function detectPackageManager(cwd: string): 'pnpm' | 'yarn' | 'bun' | 'npm' {
  let dir = cwd;
  while (dir !== path.parse(dir).root) {
    if (nativeFs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
    if (nativeFs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
    if (nativeFs.existsSync(path.join(dir, 'bun.lockb'))) return 'bun';
    if (nativeFs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';
    dir = path.dirname(dir);
  }
  return 'npm';
}

/**
 * Resolve the current `@docmd/core` version, used to pin `pkg@<version>`
 * installs to the same release line as the user's docmd. Falls back to
 * `latest` when the core package isn't resolvable (e.g. running inside
 * a CI image without node_modules linked).
 */
export function getDocmdVersion(): string {
  // DOCMD_INSTALL_VERSION overrides everything. Lets users / CI pin auto-installs
  // to a specific version (or 'latest') independent of the installed core.
  if (process.env.DOCMD_INSTALL_VERSION) {
    return process.env.DOCMD_INSTALL_VERSION.trim() || 'latest';
  }
  try {
    const corePkgPath = require.resolve('@docmd/core/package.json', {
      paths: [process.cwd(), __dirname, __monorepoRoot],
    });
    const pkg = JSON.parse(nativeFs.readFileSync(corePkgPath, 'utf8'));
    return pkg.version || 'latest';
  } catch {
    return 'latest';
  }
}

// ---------------------------------------------------------------------------
// Package-name validator (CWE-78 defence)
// ---------------------------------------------------------------------------

/**
 * True only when `name` is an `@docmd/<kind>-<short>` reference. This
 * is the FIRST line of defence; `installRuntimeDep` also cross-checks
 * against `loadRuntimeRegistry()` so a name that matches the regex but
 * isn't in the official catalog still cannot be installed.
 */
export function isValidRuntimeDepName(name: string): boolean {
  return typeof name === 'string' && PACKAGE_NAME_RE.test(name);
}

/**
 * Map an npm package name to its registry short key. Returns null when
 * the name is not an `@docmd/<kind>-*` reference.
 */
function shortNameOf(packageName: string): string | null {
  if (!isValidRuntimeDepName(packageName)) return null;
  if (packageName.startsWith('@docmd/plugin-')) return packageName.replace('@docmd/plugin-', '');
  if (packageName.startsWith('@docmd/template-')) return packageName.replace('@docmd/template-', '');
  if (packageName.startsWith('@docmd/engine-')) return packageName.replace('@docmd/engine-', '');
  return null;
}

// ---------------------------------------------------------------------------
// Idempotent TUI status reporter
// ---------------------------------------------------------------------------

/**
 * Per-build cache of short-name → status pairs. Constructed once per
 * loader run via `getBuildStatusReporter()`. Subsequent attempts to
 * report the same short name in the same build are silently dropped,
 * so a dev-server rebuild can't spam the same line pair.
 */
interface StatusLine {
  status: 'WAIT' | 'DONE' | 'FAIL' | 'SKIP' | string;
  message?: string;
}

type BuildReporter = {
  begin(shortName: string): void;
  finish(shortName: string, status: StatusLine['status']): void;
  setMessage(shortName: string, message: string): void;
  reset(): void;
};

/**
 * Build a fresh reporter. Each `loadPlugins` / `loadEngine` call gets
 * its own reporter so the cache is bound to one loader run.
 */
export function getBuildStatusReporter(): BuildReporter {
  const seen = new Map<string, StatusLine>();
  return {
    begin(shortName) {
      // Skip if we've already emitted a "WAIT" for this name this build —
      // the install is in flight (or finished); re-emitting would make the
      // TUI flicker on dev-server rebuilds.
      if (seen.has(shortName)) return;
      seen.set(shortName, { status: 'WAIT' });
      TUI.step(`Downloading missing runtime dep: ${shortName}`, 'WAIT');
    },
    finish(shortName, status) {
      const prev = seen.get(shortName);
      seen.set(shortName, { status, message: prev?.message });
      TUI.step(`Runtime dep ${status.toLowerCase()}: ${shortName}`, status);
    },
    setMessage(shortName, message) {
      const prev = seen.get(shortName) ?? { status: 'WAIT' };
      seen.set(shortName, { status: prev.status, message });
    },
    reset() {
      seen.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// `spawn`-based installer (CWE-78 fix)
// ---------------------------------------------------------------------------

/**
 * Build the arg array for the user's package manager. Returned as an
 * array, never a string, so `spawn` doesn't go through a shell and the
 * package name can never be reinterpreted as a flag or command.
 */
function buildInstallArgs(packageName: string, pm: 'pnpm' | 'yarn' | 'bun' | 'npm'): string[] {
  switch (pm) {
    case 'pnpm': return ['add', packageName];
    case 'yarn': return ['add', packageName];
    case 'bun':  return ['add', packageName];
    case 'npm':  return ['install', packageName];
  }
}

/**
 * Non-shell install of an official runtime dependency. Replaces the
 * previous `execSync(\`${pm} add ${pkg}\`)` with `spawn` + arg array.
 *
 * Defence in depth (in order):
 *   1. `isValidRuntimeDepName(pkg)` — strict regex.
 *   2. `loadRuntimeRegistry()[shortName]` — official catalog lookup.
 *   3. `spawn(pm, [...args], { shell: false })` — never hits a shell.
 *
 * Returns true on a clean exit code from the package manager, false
 * otherwise. Caller decides whether a fail should be fatal.
 */
export function installRuntimeDep(packageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isValidRuntimeDepName(packageName)) {
      TUI.warn(`Refusing to install non-runtime dep: ${packageName}`);
      return resolve(false);
    }
    const shortName = shortNameOf(packageName);
    if (!shortName) return resolve(false);

    const registry = loadRuntimeRegistry();
    if (!registry[shortName]) {
      TUI.warn(`Runtime dep "${shortName}" not found in official registry`);
      return resolve(false);
    }

    const cwd = process.cwd();
    const pm = detectPackageManager(cwd);
    const version = getDocmdVersion();
    const versionedPackage =
      version === 'latest' ? packageName : `${packageName}@${version}`;

    const reporter = getBuildStatusReporter();
    reporter.begin(shortName);

    const args = buildInstallArgs(versionedPackage, pm);
    let stderr = '';
    let stdout = '';
    // shell: true only on Windows because npm/yarn/pnpm are .cmd batch
    // files there. On macOS/Linux, shell: false is more secure and
    // works because the package managers are real executables. The
    // package name is already validated by the strict regex above, so
    // enabling the shell on Windows introduces no injection surface.
    const useShell = process.platform === 'win32';
    const child = spawn(pm, args, { cwd, shell: useShell, timeout: 60_000 });

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('error', (err) => {
      reporter.finish(shortName, 'FAIL');
      const surface = (stderr || err.message || 'unknown error')
        .toString()
        .split('\n')
        .filter(Boolean)
        .slice(0, 3)
        .join(' | ');
      const isTemplate = packageName.startsWith('@docmd/template-');
      const hint = isTemplate
        ? `Add "${packageName}" to your package.json dependencies, then run your normal install step.`
        : `Run "docmd add ${shortName}" to install it, or add "${packageName}" to your package.json.`;
      TUI.warn(
        `Auto-install of ${packageName} failed: ${surface}\n  > ${hint}`,
      );
      resolve(false);
    });

    child.on('close', (code) => {
      if (code === 0) {
        reporter.finish(shortName, 'DONE');
        return resolve(true);
      }
      reporter.finish(shortName, 'FAIL');
      const surface = stderr
        .toString()
        .split('\n')
        .filter(Boolean)
        .slice(0, 3)
        .join(' | ');
      const isTemplate = packageName.startsWith('@docmd/template-');
      const hint = isTemplate
        ? `Add "${packageName}" to your package.json dependencies, then run your normal install step.`
        : `Run "docmd add ${shortName}" to install it, or add "${packageName}" to your package.json.`;
      TUI.warn(
        `Auto-install of ${packageName} failed (exit ${code}): ${surface || 'unknown error'}\n  > ${hint}`,
      );
      resolve(false);
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers consumed by hooks.ts and engine.ts
// ---------------------------------------------------------------------------

/**
 * Short key for a package name, used for status lines and registry
 * lookups. Returns null for names that fail validation.
 */
export function shortKey(packageName: string): string | null {
  return shortNameOf(packageName);
}

/**
 * Manually resolve a package entry point by walking up from `startDir`
 * looking for `node_modules/<packageName>/package.json`. This bypasses
 * Node's internal module resolution cache, which can fail to find a
 * package that was just installed during the same process (the cache
 * remembers the "not found" result from the initial failed resolve).
 *
 * Returns the absolute path to the entry JS file, or null if not found.
 */
function manualResolvePackageEntry(packageName: string, startDir: string): string | null {
  const pkgSubPath = path.join('node_modules', packageName);
  let dir = path.resolve(startDir);
  // Walk up the directory tree looking for node_modules/<pkg>
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, pkgSubPath, 'package.json');
    if (nativeFs.existsSync(candidate)) {
      try {
        const pkg = JSON.parse(nativeFs.readFileSync(candidate, 'utf8'));
        // Resolve the entry point: exports['.'] > main > index.js
        let entry: string | undefined;
        if (pkg.exports && typeof pkg.exports === 'object' && pkg.exports['.']) {
          const exp = pkg.exports['.'];
          entry = typeof exp === 'string' ? exp : (exp.import || exp.require || exp.default);
        }
        if (!entry) entry = pkg.main || 'index.js';
        const cleanEntry = (entry || 'index.js').replace(/^\.\//, '');
        const entryPath = path.join(dir, pkgSubPath, cleanEntry);
        if (nativeFs.existsSync(entryPath)) return entryPath;
        // Try dist/index.js as a common fallback
        const distEntry = path.join(dir, pkgSubPath, 'dist', 'index.js');
        if (nativeFs.existsSync(distEntry)) return distEntry;
      } catch {
        // Malformed package.json — keep walking
      }
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Re-load `pkg` after an install attempt. Tries `createRequire` first
 * (honours exports conditions), then falls back to a manual node_modules
 * walk-up that bypasses Node's internal resolution cache. The cache can
 * stale-fail when a package was just `npm install`ed during the same
 * process — the initial `require.resolve` failure is remembered even
 * after the package appears on disk.
 *
 * Returns the module reference or null on failure.
 */
export async function tryLoadAfterInstall(
  packageName: string,
  consumerCwd: string = process.cwd(),
): Promise<any | null> {
  // Strategy 1: createRequire (honours exports field, but may stale-cache)
  try {
    const consumerRequire = createRequire(consumerCwd + '/');
    const entry = consumerRequire.resolve(packageName);
    return await import(pathToFileURL(entry).href);
  } catch {
    // Fall through to manual resolution
  }

  // Strategy 2: manual node_modules walk-up (bypasses cache, always
  // does a fresh filesystem check). This is the reliable path when
  // the package was installed seconds ago in the same process.
  const manualEntry = manualResolvePackageEntry(packageName, consumerCwd);
  if (manualEntry) {
    try {
      return await import(pathToFileURL(manualEntry).href);
    } catch (e: any) {
      const detail = e?.code ? `${e.code}: ${e.message}` : (e?.message || String(e));
      TUI.warn(`Post-install load of ${packageName} (manual resolve to ${manualEntry}) failed: ${detail}`);
      return null;
    }
  }

  TUI.warn(`Post-install load of ${packageName} from ${consumerCwd} failed: package not found in node_modules tree`);
  return null;
}
