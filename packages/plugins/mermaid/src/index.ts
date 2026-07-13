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
import { fileURLToPath } from 'url';
import type { PluginDescriptor } from '@docmd/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const plugin: PluginDescriptor = {
  name: 'mermaid',
  version: '0.8.13',
  capabilities: ['markdown', 'assets']
};

export function markdownSetup(md: any) {
  const defaultFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim();
    if (info === 'mermaid') {
      return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>\n`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}

export function getAssets() {
  return [
    {
      src: path.join(__dirname, 'init-mermaid.js'),
      dest: 'assets/js/init-mermaid.js',
      type: 'js',
      location: 'body',
      attributes: { type: 'module' },
      // Conditional loading (new in 0.8.7): only inject the init script on
      // pages whose rendered HTML actually contains a mermaid diagram block.
      // This avoids the ~500 KB mermaid library CDN fetch on every other
      // page of the site.
      condition: { pageHtmlMatches: 'class="mermaid"' }
    }
  ];
}