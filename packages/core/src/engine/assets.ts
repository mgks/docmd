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
import { fsUtils as fs } from '@docmd/utils';
import esbuild from 'esbuild';
import { createRequire } from 'module';
import nativeFs from 'fs';

const _require = createRequire(import.meta.url);
import * as themes from '@docmd/themes';
import * as ui from '@docmd/ui';

const pkgUrl = new URL('../../package.json', import.meta.url);
const pkg = JSON.parse(nativeFs.readFileSync(pkgUrl, 'utf8'));

const COPYRIGHT_BANNER = `/*!
 * docmd (v${pkg.version})
 * Copyright (c) 2025-present docmd.io
 * License: MIT
 */`;

export async function findFilesRecursive(dir: string, extensions: string[]): Promise<string[]> {
  let files: string[] = [];
  if (!await fs.exists(dir)) return [];
  const items = await nativeFs.promises.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    // Explicitly ignore system files, git, and node_modules to prevent duplicate ID crashes
    if (item.name === 'node_modules' || item.name.startsWith('.') || item.name === 'site') continue;

    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(await findFilesRecursive(fullPath, extensions));
    } else if (item.isFile()) {
      if (!extensions || extensions.includes(path.extname(item.name))) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

export async function prepareAssets(config: any, outputDir: string, options: any = {}) {
  const CWD = process.cwd();

  // 1. Core UI Assets
  const uiAssets = ui.getAssetsDir();
  if (await fs.exists(uiAssets)) await fs.copy(uiAssets, path.join(outputDir, 'assets'));

  // When stringMode is enabled, translations are baked into HTML at
  // build time. The client-side i18n runtime (docmd-i18n-strings.js) is
  // redundant and harmful — it reads/writes localStorage for locale
  // preferences which can cause client-side re-translation of already-
  // baked HTML. Remove it from the output so it's never fetched.
  if (config.i18n?.stringMode === true) {
    const i18nRuntimePath = path.join(outputDir, 'assets', 'js', 'docmd-i18n-strings.js');
    if (nativeFs.existsSync(i18nRuntimePath)) {
      nativeFs.unlinkSync(i18nRuntimePath);
    }
  }

  // 2. Theme Assets
  const themesDir = themes.getThemesDir();
  if (await fs.exists(themesDir)) await fs.copy(themesDir, path.join(outputDir, 'assets/css'));

  // 3. User Assets (Root)
  const userAssets = path.resolve(CWD, 'assets');
  if (await fs.exists(userAssets)) await fs.copy(userAssets, path.join(outputDir, 'assets'));

  // 3.5. User Assets (Docs Dir)
  if (config.src) {
    const srcAssets = path.resolve(CWD, config.src, 'assets');
    if (await fs.exists(srcAssets)) await fs.copy(srcAssets, path.join(outputDir, 'assets'));
  }

  // 4. Minification (Production only)
  if (config.minify !== false && !options.isDev) {
    await minifyDir(path.join(outputDir, 'assets'));
  }
}

// Template Assets
// Templates ship their own CSS/JS bundles. We copy them into
// `assets/template/<basename>` so they survive minification and
// can be referenced with a stable URL.
export async function prepareTemplateAssets(config: any, outputDir: string) {
  // The hooks object is exported by @docmd/api. We import lazily to avoid
  // a hard build-time cycle between @docmd/core ↔ @docmd/api.
  const { hooks } = await import('@docmd/api');
  if (!hooks || !Array.isArray(hooks.templateAssets) || hooks.templateAssets.length === 0) return;

  const templateDir = path.join(outputDir, 'assets', 'template');
  await fs.ensureDir(templateDir);

  for (const asset of hooks.templateAssets) {
    if (!asset || !asset.path || !asset.type) continue;
    if (asset.type !== 'css' && asset.type !== 'js') continue;
    if (!await fs.exists(asset.path)) {
      // Don't crash the build — the resolver already warned at render time.
      continue;
    }
    const dest = path.join(templateDir, path.basename(asset.path));
    await fs.copy(asset.path, dest);
  }
}

async function minifyDir(dir: string) {
  const assets = await findFilesRecursive(dir, ['.css', '.js']);
  for (const file of assets) {
    if (file.endsWith('.min.js') || file.endsWith('.min.css')) continue;
    try {
      const ext = path.extname(file);
      const content = await nativeFs.promises.readFile(file, 'utf8');
      const result = await esbuild.transform(content, {
        loader: ext.slice(1) as any,
        minify: true,
        legalComments: 'none'
      });
      await nativeFs.promises.writeFile(file, COPYRIGHT_BANNER + '\n' + result.code);
    } catch {
      // Ignore errors for non-standard files or mixed content
    }
  }
}

// Generate HTML Tag Helper
export function generateAssetTag(pathOrUrl: string, type: string, attributes: any = {}) {
  const attrs = Object.entries(attributes).map(([k, v]) => v === true ? k : `${k}="${v}"`).join(' ');
  if (type === 'css') return `<link rel="stylesheet" href="${pathOrUrl}" ${attrs}>`;
  if (type === 'js') return `<script src="${pathOrUrl}" ${attrs}></script>`;
  return '';
}