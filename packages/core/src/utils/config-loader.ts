/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * @package     @docmd/core (and ecosystem)
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

import path from 'path';
import fs from 'fs';
import { validateConfig } from '@docmd/parser';
import { normalizeConfig } from './config-schema.js';
import { buildAutoNav } from './auto-router.js';
import { pathToFileURL } from 'url';
import { TUI } from '@docmd/api';

function hasMarkdownFiles(dir: string, maxDepth = 2, currentDepth = 0): boolean {
  if (currentDepth > maxDepth) return false;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'site' || entry.name === 'dist' || entry.name === 'out') continue;
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.markdown') || entry.name.endsWith('.ejs'))) return true;
      if (entry.isDirectory()) {
        if (hasMarkdownFiles(path.join(dir, entry.name), maxDepth, currentDepth + 1)) return true;
      }
    }
  } catch { /* ignore */ }
  return false;
}

function detectHeuristics(cwd: string, srcDir: string) {
  const absSrcDir = path.join(cwd, srcDir);
  let items: any[] = [];
  try {
    items = fs.readdirSync(absSrcDir, { withFileTypes: true });
  } catch {
    return { versions: null, i18n: null };
  }

  const versionFolders: string[] = [];
  const localeFolders: string[] = [];

  const langMap: Record<string, string> = {
    en: 'English',
    de: 'Deutsch',
    zh: '简体中文',
    fr: 'Français',
    ja: '日本語',
    es: 'Español',
    ru: 'Русский',
    it: 'Italiano',
    pt: 'Português'
  };

  const isVersion = (name: string) => /^v\d/i.test(name);
  const isLocale = (name: string) => /^[a-z]{2}(-[A-Z]{2})?$/i.test(name);

  for (const item of items) {
    if (!item.isDirectory()) continue;
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;

    if (isVersion(item.name)) {
      versionFolders.push(item.name);
    } else if (isLocale(item.name)) {
      localeFolders.push(item.name);
    }
  }

  // Sort versions descending (v0.8, v0.7, etc.)
  versionFolders.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

  let finalVersions: any = null;
  let finalI18n: any = null;

  if (versionFolders.length > 0) {
    finalVersions = {
      all: versionFolders.map(v => ({
        id: v,
        dir: path.join(srcDir, v),
        label: v
      })),
      current: versionFolders[0]
    };

    // Check if the current/first version contains locales
    const currentVerDir = path.join(absSrcDir, versionFolders[0]);
    if (fs.existsSync(currentVerDir)) {
      try {
        const verItems = fs.readdirSync(currentVerDir, { withFileTypes: true });
        const verLocales = verItems
          .filter(item => item.isDirectory() && isLocale(item.name))
          .map(item => item.name);
        
        if (verLocales.length > 0) {
          const defaultLoc = verLocales.includes('en') ? 'en' : verLocales[0];
          finalI18n = {
            default: defaultLoc,
            locales: verLocales.map(loc => ({
              id: loc,
              label: langMap[loc.toLowerCase()] || loc.toUpperCase()
            }))
          };
        }
      } catch { /* ignore read errors */ }
    }
  } else if (localeFolders.length > 0) {
    const defaultLoc = localeFolders.includes('en') ? 'en' : localeFolders[0];
    finalI18n = {
      default: defaultLoc,
      locales: localeFolders.map(loc => ({
        id: loc,
        label: langMap[loc.toLowerCase()] || loc.toUpperCase()
      }))
    };
  }

  return { versions: finalVersions, i18n: finalI18n };
}

async function buildZeroConfig(cwd: string, isDev = false, quiet = false, options: any = {}) {

  if (isDev && !quiet) {
    if (!(global as any).__DOCMD_ZERO_LOGGED) {
      TUI.info('Zero-Config mode activated. Analyzing directory...');
      (global as any).__DOCMD_ZERO_LOGGED = true;
    }
  }

  // Detect if there's a specific docs folder, otherwise use root
  const candidates = ['docs', 'src/docs', 'documentation', 'content'];
  let srcDir: string | null = null;
  for (const c of candidates) {
    if (fs.existsSync(path.join(cwd, c)) && hasMarkdownFiles(path.join(cwd, c), 2)) {
      srcDir = c;
      break;
    }
  }

  if (!srcDir) {
    // Check if the root directory itself has markdown files
    if (hasMarkdownFiles(cwd, 1)) {
      srcDir = '.';
    }
  }

  if (!srcDir) {
    TUI.error('Configuration Error', 'No documentation directory or files found.');
    TUI.info(`Zero-Config expects one of: ${candidates.join(', ')} or markdown files in the project root.`);
    TUI.info('Create one of these folders, place markdown files in the root, or provide a docmd.config.json file.');

    const err: any = new Error('No candidate documentation directory or files found.');
    err.silent = true;
    throw err;
  }

  const absSrcDir = path.join(cwd, srcDir);

  if (!hasMarkdownFiles(absSrcDir, 2)) {
    TUI.warn(`No documentation content found in ${absSrcDir}`);
    TUI.info('docmd expects markdown files in the source folder.');

    const err: any = new Error('No content found for documentation.');
    err.silent = true;
    throw err;
  }

  // Try extracting defaults from package.json
  let autoTitle = path.basename(cwd) || 'Documentation';
  let autoDesc = '';
  try {
    const pkgPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) {
        autoTitle = pkg.name.replace(/^@[^/]+\//, '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      if (pkg.description) autoDesc = pkg.description;
    }
  } catch { /* ignore */ }

  const { versions, i18n } = detectHeuristics(cwd, srcDir);

  // Dynamically build the navigation tree only if we do not have versions/locales at root
  // (otherwise navigation is handled at version/locale level)
  const autoNav = (!versions && !i18n) ? buildAutoNav(absSrcDir) : null;

  const autoConfig: any = {
    title: autoTitle,
    description: autoDesc,
    src: srcDir,
    out: 'site',
    layout: { spa: true },
    theme: { name: 'default', appearance: 'system' }
  };

  if (autoNav) {
    autoConfig.navigation = autoNav;
  }
  if (versions) {
    autoConfig.versions = versions;
  }
  if (i18n) {
    autoConfig.i18n = i18n;
  }

  // Merge with global defaults
  const merged = { ...(options._globalDefaults || {}), ...autoConfig };

  return normalizeConfig(merged);
}

export async function loadConfig(configPath: string, options: any = {}) {
  // D-H1: honour an explicit `cwd` option (used by build.ts when the
  // caller passes --config <abs-path> from a foreign working dir). Falls
  // back to `process.cwd()` so existing callers continue to work.
  const cwd = options.cwd || process.cwd();

  let absoluteConfigPath = path.resolve(cwd, configPath);

  if (configPath === 'docmd.config.js') {
    const candidates = [
      'docmd.config.json',
      'docmd.config.ts',
      'docmd.config.js',
      'docmd.config.mjs',
      'config.js'
    ];
    let found = false;
    for (const c of candidates) {
      const p = path.resolve(cwd, c);
      if (fs.existsSync(p)) {
        absoluteConfigPath = p;
        found = true;
        break;
      }
    }

    if (!found) {
      // Check if we have docs directory with markdown files or if root has them.
      // If we don't even have a docs directory, or if it's empty, auto-run init:
      const docCandidates = ['docs', 'src/docs', 'documentation', 'content'];
      let hasDocs = false;
      for (const d of docCandidates) {
        const dp = path.join(cwd, d);
        if (fs.existsSync(dp) && hasMarkdownFiles(dp, 2)) {
          hasDocs = true;
          break;
        }
      }

      if (!hasDocs && hasMarkdownFiles(cwd, 1)) {
        hasDocs = true;
      }

      if (!hasDocs) {
        if (process.argv.includes('--json') || options.quiet) {
          throw new Error('No documentation directory or configuration found.');
        }
        TUI.warn('No documentation or configuration found. Initializing new project...');
        const { initProject } = await import('../commands/init.js');
        await initProject();

        // Re-check config candidates
        for (const c of candidates) {
          const p = path.resolve(cwd, c);
          if (fs.existsSync(p)) {
            absoluteConfigPath = p;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        // Fallback to Zero-Config if nothing is found to prevent crashing!
        if (!(global as any).__DOCMD_NO_CONFIG_LOGGED && !options.quiet) {
          TUI.warn('No config found. Running in auto mode. Run `docmd init` to create one.');
          (global as any).__DOCMD_NO_CONFIG_LOGGED = true;
        }
        const autoConfig = await buildZeroConfig(cwd, options.isDev, options.quiet, options);
        return JSON.parse(JSON.stringify(autoConfig));
      }
    }
  } else if (!fs.existsSync(absoluteConfigPath)) {
    throw new Error(`Config file not found: ${absoluteConfigPath}`);
  }

  // Cleanup any orphaned temp config files from previous failed reloads
  try {
      const configDir = path.dirname(absoluteConfigPath);
      const baseName = path.basename(absoluteConfigPath).split('.')[0];
      const files = fs.readdirSync(configDir);
      for (const file of files) {
          if (file.startsWith(`${baseName}-`) && (file.endsWith('.js') || file.endsWith('.mjs'))) {
              const fullPath = path.join(configDir, file);
              // If it has a timestamp-like suffix, it's one of ours
              if (/-[0-9]{13}\.(js|mjs)$/.test(file)) {
                  fs.unlinkSync(fullPath);
              }
          }
      }
  } catch { /* ignore cleanup errors */ }

  try {
    // Polyfill defineConfig globally so the config file works 
    // even if @docmd/core isn't installed locally in the target project.
    (global as any).defineConfig = (config: any) => config;

    // Use a timestamp to bypass ESM cache if file is likely changed
    const ts = Date.now();
    let configUrl = pathToFileURL(absoluteConfigPath).href + '?t=' + ts;
    let tempConfigPath: string | null = null;
    let rawConfig: any;

    try {
      if (absoluteConfigPath.endsWith('.json')) {
          rawConfig = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf-8'));
      } else {
          if (absoluteConfigPath.endsWith('.ts')) {
              const esbuild = await import('esbuild');
              tempConfigPath = absoluteConfigPath.replace(/\.ts$/, `-${ts}.mjs`);
              await esbuild.build({
                  entryPoints: [absoluteConfigPath],
                  outfile: tempConfigPath,
                  format: 'esm',
                  bundle: true,
                  packages: 'external',
                  platform: 'node',
                  target: 'node18'
              });
              configUrl = pathToFileURL(tempConfigPath).href;
          } else if (absoluteConfigPath.endsWith('.js') || absoluteConfigPath.endsWith('.mjs')) {
              // Copy to a temp file to guarantee cache bypass (query strings
              // are not always reliable for ESM cache busting in all Node versions)
              const ext = path.extname(absoluteConfigPath);
              tempConfigPath = absoluteConfigPath.replace(new RegExp(`\\${ext}$`), `-${ts}${ext}`);
              fs.copyFileSync(absoluteConfigPath, tempConfigPath);
              configUrl = pathToFileURL(tempConfigPath).href;
          }

          const rawModule = await import(configUrl);
          rawConfig = rawModule.default || rawModule;
      }
        
      // If user has 'search' or 'theme' at root, but no 'layout' object, they are legacy.
      const isLegacy = !rawConfig.layout && (
        rawConfig.search !== undefined ||
        (rawConfig.theme && rawConfig.theme.enableModeToggle !== undefined) ||
        rawConfig.sponsor
      );

      if (isLegacy) {
        TUI.error('Legacy Configuration Detected', 'Your docmd.config uses an outdated structure.');
        TUI.info(`Run ${TUI.cyan('docmd migrate')} to automatically upgrade your configuration.`);
      }

      validateConfig(rawConfig);
      const hasExplicitNav = 'navigation' in rawConfig;

      // Merge with global defaults: root project config overrides global defaults
      const mergedConfig = { ...(options._globalDefaults || {}), ...rawConfig };

      const normalized = normalizeConfig(mergedConfig);

      if (normalized._baseAutoDerived) {
        TUI.info(`${TUI.dim('base auto-derived from url:')} ${TUI.cyan(normalized._baseAutoDerived)}`);
      }

      // Navigation Handling: Prioritize local navigation.json in the project folder
      let navScanDir = path.resolve(cwd, normalized.srcDir);
      let localNavPath = path.join(navScanDir, 'navigation.json');

      // Adjust navScanDir if i18n is enabled to check in the default locale folder
      if (normalized.i18n?.default) {
        const localeScanDir = path.join(navScanDir, normalized.i18n.default);
        if (fs.existsSync(localeScanDir)) {
          navScanDir = localeScanDir;
          localNavPath = path.join(navScanDir, 'navigation.json');
        }
      }

      // If navigation.json exists locally, it ALWAYS wins over inherited global navigation
      if (fs.existsSync(localNavPath)) {
        try {
          normalized.navigation = JSON.parse(fs.readFileSync(localNavPath, 'utf-8'));
        } catch (e: any) {
          TUI.error('Navigation Error', `Failed to parse ${localNavPath}: ${e.message}`);
        }
      } 
      // Otherwise, if we still don't have any navigation (not from global, not from config, not from JSON), 
      // check for localized/versioned nav or fallback to auto-nav
      else if (!normalized.navigation || (normalized.navigation.length === 0 && !hasExplicitNav)) {
        let hasNavInSubdirs = false;

        if (normalized.i18n?.default) {
          // Check if any locale dir has navigation.json
          hasNavInSubdirs = (normalized.i18n.locales || []).some((l: any) =>
            fs.existsSync(path.join(path.resolve(cwd, normalized.srcDir), l.id, 'navigation.json'))
          );
        }

        // Check if any version dir has navigation.json
        if (!hasNavInSubdirs && normalized.versions?.all?.length > 0) {
          hasNavInSubdirs = normalized.versions.all.some((v: any) => {
            const vDir = path.resolve(cwd, v.dir);
            if (fs.existsSync(path.join(vDir, 'navigation.json'))) return true;
            if (normalized.i18n?.default) {
              return fs.existsSync(path.join(vDir, normalized.i18n.default, 'navigation.json'));
            }
            return false;
          });
        }

        if (!hasNavInSubdirs) {
          if (!options.quiet && !(global as any).__DOCMD_ZERO_NAV_LOGGED) {
            TUI.info('No navigation settings found. Auto-generating with Zero-Config...');
            if (options.isDev) (global as any).__DOCMD_ZERO_NAV_LOGGED = true;
          }
          normalized.navigation = buildAutoNav(navScanDir);
        }
      }

      normalized._resolvedPath = absoluteConfigPath;

      // Ensure the final configuration object is completely JSON-serialisable
      // This is crucial for passing the config to worker threads in the new multi-threaded build engine
      return JSON.parse(JSON.stringify(normalized));
    } finally {
      if (tempConfigPath && fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
      }
      // Clean up global to avoid pollution
      delete (global as any).defineConfig;
    }

  } catch (e: any) {
    if (e.message === 'Invalid configuration file.') throw e;
    throw new Error(`Error parsing config file: ${e.message}`);
  }
}