/**
 * --------------------------------------------------------------------
 * docmd : the minimalist, zero-config documentation generator.
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

import chalk from 'chalk';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const hooks: any = {
  markdownSetup: [],
  injectHead: [],
  injectBody: [],
  onPostBuild: [],
  assets: [],
  getClientAssets: [], // Legacy support
  actions: {},         // action name → handler function (for WebSocket RPC)
  events: {}           // event name → handler function (fire-and-forget)
};

// Map short names to package names
const ALIASES: Record<string, string> = {
  'search': '@docmd/plugin-search',
  'seo': '@docmd/plugin-seo',
  'sitemap': '@docmd/plugin-sitemap',
  'analytics': '@docmd/plugin-analytics',
  'mermaid': '@docmd/plugin-mermaid',
  'llms': '@docmd/plugin-llms',
  'pwa': '@docmd/plugin-pwa'
};

export async function loadPlugins(config: any) {
  // 1. Reset hooks
  Object.keys(hooks).forEach(key => {
    hooks[key] = Array.isArray(hooks[key]) ? [] : {};
  });

  // 2. Initialize Plugin Map (Name -> Options)
  // This ensures unique plugins (last write wins)
  const pluginMap = new Map();
  const searchEnabled = config.optionsMenu ? config.optionsMenu.components.search !== false : config.search !== false;

  // A. Add Defaults
  pluginMap.set('@docmd/plugin-search', searchEnabled ? {} : false);

  if (!config.hasExplicitPlugins) {
    pluginMap.set('@docmd/plugin-seo', config.plugins?.seo || {});
    pluginMap.set('@docmd/plugin-sitemap', config.plugins?.sitemap || {});
    pluginMap.set('@docmd/plugin-analytics', config.plugins?.analytics || {});
    pluginMap.set('@docmd/plugin-pwa', config.plugins?.pwa || {});
  }

  // B. Add/Override from Config
  if (config.plugins) {
    Object.keys(config.plugins).forEach(key => {
      // Resolve Alias (e.g., 'mermaid' -> '@docmd/plugin-mermaid')
      const resolvedName = ALIASES[key] || key;
      const options = config.plugins[key];

      // Update map (Override default if exists)
      pluginMap.set(resolvedName, options);
    });
  }

  // 3. Load and Register
  for (const [name, options] of pluginMap) {
    if (options === false) continue; // Skip disabled

    try {
      // Try resolving standard package
      let rawModule;
      try {
        rawModule = await import(name);
      } catch (e) {
        // Fallback for local development or misnamed packages
        console.warn(chalk.dim(`   > Debug: Could not import '${name}', checking alternatives...`));
        rawModule = await import(require.resolve(name, { paths: [process.cwd(), import.meta.dirname] }));
      }

      const pluginModule = rawModule.default || rawModule;
      registerPlugin(name, pluginModule, options);
    } catch (e: any) {
      console.warn(chalk.yellow(`⚠️  Could not load plugin: ${name}`));
      // Only log full error in verbose/debug mode to reduce noise
      // console.error(e.message); 
    }
  }

  return hooks;
}

function registerPlugin(name: string, plugin: any, options: any) {
  if (typeof plugin.markdownSetup === 'function') hooks.markdownSetup.push((md: any) => plugin.markdownSetup(md, options));

  if (typeof plugin.generateMetaTags === 'function') {
    hooks.injectHead.push((config: any, page: any, root: any) => plugin.generateMetaTags(config, page, root));
  }

  if (typeof plugin.generateScripts === 'function') {
    hooks.injectHead.push((c: any) => plugin.generateScripts(c, options).headScriptsHtml || '');
    hooks.injectBody.push((c: any) => plugin.generateScripts(c, options).bodyScriptsHtml || '');
  }

  if (typeof plugin.onPostBuild === 'function') hooks.onPostBuild.push((ctx: any) => plugin.onPostBuild({ ...ctx, options }));

  if (typeof plugin.getAssets === 'function') hooks.assets.push(() => plugin.getAssets(options));

  // Plugin actions (WebSocket RPC handlers)
  if (plugin.actions && typeof plugin.actions === 'object') {
    Object.assign(hooks.actions, plugin.actions);
  }

  // Plugin events (fire-and-forget handlers)
  if (plugin.events && typeof plugin.events === 'object') {
    Object.assign(hooks.events, plugin.events);
  }
}