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

import type { Engine, EngineResult } from './types.js';
import { engineRegistry, registerEngine } from './types.js';
import { installRuntimeDep, tryLoadAfterInstall, isValidRuntimeDepName } from './runtime-deps.js';
export { engineRegistry, registerEngine };

// ---------------------------------------------------------------------------
// Allowed task types — the API layer acts as a security boundary between
// plugins and engines. Plugins may only request tasks in this set.
// Engines themselves are unrestricted and can implement any task type.
// ---------------------------------------------------------------------------

const ALLOWED_TASK_TYPES = new Set([
  'file:discover',
  'file:read',
  'file:readBatch',
  'file:write',
  'file:exists',
  'git:log',
  'git:status',
  'search:index',
  'search:query',
]);

// ---------------------------------------------------------------------------
// Engine Loading
// ---------------------------------------------------------------------------

/**
 * Load an engine by name.
 *
 * Resolution order:
 *   1. Custom loader registered via `registerEngine()`
 *   2. Built-in engines: 'js' (always available), 'rust' (optional, native binary)
 *
 * The Rust engine gracefully falls back to JS if the native binary is not
 * installed, so callers can always specify 'rust' without special-casing.
 */
export async function loadEngine(name: string = 'js'): Promise<Engine> {
  // Custom loader takes priority
  const loader = engineRegistry.get(name);
  if (loader) {
    const engine = await loader();
    if (engine) return engine;
  }

  if (name === 'js') {
    // JS engine is a hard requirement. Auto-install if it's missing
    // (e.g. user opted out of @docmd/api optionalDependencies at
    // install time), then retry once. There is no JS fallback for a
    // JS engine — call it a fatal loader failure if install also fails.
    try {
      const { createJsEngine } = await import('@docmd/engine-js');
      return createJsEngine();
    } catch (err) {
      if (!isValidRuntimeDepName('@docmd/engine-js')) throw err;
      const installed = await installRuntimeDep('@docmd/engine-js');
      if (installed) {
        const reloaded = await tryLoadAfterInstall('@docmd/engine-js');
        if (reloaded) {
          const { createJsEngine } = reloaded as any;
          return createJsEngine();
        }
      }
      throw new Error(
        `[docmd] JS engine unavailable after auto-install: ${(err as Error).message}. ` +
        `Add "@docmd/engine-js" to your package.json dependencies.`,
      );
    }
  }

  if (name === 'rust') {
    // Rust engine is an optional performance accelerator. Try to load
    // it; if the package is missing, auto-install it; if install fails
    // OR the binary isn't usable on this platform, fall back to JS.
    try {
      const { createRustEngine, isRustEngineAvailable } = await import('@docmd/engine-rust');
      if (!isRustEngineAvailable()) {
        console.warn('[docmd] Rust engine not supported on this platform, falling back to JS engine.');
        return loadEngine('js');
      }
      return createRustEngine();
    } catch (error) {
      if (isValidRuntimeDepName('@docmd/engine-rust')) {
        const installed = await installRuntimeDep('@docmd/engine-rust');
        if (installed) {
          const reloaded = await tryLoadAfterInstall('@docmd/engine-rust');
          if (reloaded) {
            const { createRustEngine, isRustEngineAvailable } = reloaded as any;
            if (isRustEngineAvailable && isRustEngineAvailable()) {
              return createRustEngine();
            }
          }
        }
      }
      console.warn(`[docmd] Rust engine unavailable (${(error as Error).message}), falling back to JS engine.`);
      return loadEngine('js');
    }
  }

  throw new Error(`Unknown engine: '${name}'. Available built-in engines: js, rust`);
}

/**
 * Check if a named engine is available without loading it.
 */
export async function isEngineAvailable(name: string): Promise<boolean> {
  if (name === 'js') return true;
  if (name === 'rust') {
    try {
      const { isRustEngineAvailable } = await import('@docmd/engine-rust');
      return isRustEngineAvailable();
    } catch {
      return false;
    }
  }
  return engineRegistry.has(name);
}

/**
 * Return names of all currently available engines.
 */
export async function getAvailableEngines(): Promise<string[]> {
  const engines: string[] = ['js'];
  if (await isEngineAvailable('rust')) engines.push('rust');
  return engines;
}

// ---------------------------------------------------------------------------
// Security Layer — plugin-facing task runner
//
// Plugins call these helpers rather than calling engine.run() directly.
// The API layer validates the task type against the allowlist before
// forwarding to the engine, preventing plugins from invoking arbitrary tasks.
// ---------------------------------------------------------------------------

/**
 * Run a task on an engine.
 *
 * @param engine  - The engine instance to use.
 * @param type    - Task type (must be in the allowed set).
 * @param payload - Task payload.
 * @param timeout - Optional timeout in ms.
 * @param trusted - Internal flag: bypass the allowlist (used by docmd core only).
 * @throws if the task type is not allowed or the task fails.
 */
export async function runTask<T = any>(
  engine: Engine,
  type: string,
  payload: any,
  timeout?: number,
  trusted = false,
): Promise<T> {
  if (!trusted && !ALLOWED_TASK_TYPES.has(type)) {
    throw new Error(
      `Task type '${type}' is not allowed for plugins. ` +
      `Allowed types: ${[...ALLOWED_TASK_TYPES].join(', ')}`,
    );
  }

  const result: EngineResult<T> = await engine.run<T>({ type, payload, timeout });
  if (!result.success) {
    throw new Error(result.error || `Task '${type}' failed`);
  }
  return result.data as T;
}

// ---------------------------------------------------------------------------
// Convenience Helpers (plugin-safe, validated against allowlist)
// ---------------------------------------------------------------------------

/**
 * Discover files in a directory tree.
 */
export async function discoverFiles(
  engine: Engine,
  dir: string,
  extensions?: string[],
  exclude?: string[],
): Promise<Array<{ path: string; size: number; mtimeMs: number }>> {
  return runTask(engine, 'file:discover', { dir, extensions, exclude });
}

/**
 * Read multiple files in a single batch operation.
 * Returns a Map from file path to file content.
 */
export async function readFilesBatch(
  engine: Engine,
  paths: string[],
): Promise<Map<string, string>> {
  const result = await runTask<Record<string, string>>(engine, 'file:readBatch', { paths });
  return new Map(Object.entries(result));
}

/**
 * Get git log for one or more files.
 * Returns a Map from file path to array of commit entries.
 */
export async function getGitLog(
  engine: Engine,
  filePaths: string[],
  maxCommits = 6,
): Promise<Map<string, Array<{ hash: string; shortHash: string; author: string; email: string; timestamp: number; message: string }>>> {
  const result = await runTask<Record<string, any[]>>(engine, 'git:log', { filePaths, maxCommits });
  return new Map(Object.entries(result));
}

/**
 * Build a search index from a list of documents.
 * Returns a serialised index string (format depends on the engine).
 */
export async function buildSearchIndex(
  engine: Engine,
  documents: Array<{
    id: string;
    title: string;
    content: string;
    path: string;
    locale?: string;
    version?: string;
  }>,
): Promise<string> {
  return runTask(engine, 'search:index', { documents });
}