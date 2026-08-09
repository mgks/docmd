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

import { embed } from 'embed-lite';

function unquote(value: string): string {
  if (!value) return '';
  const val = value.trim();
  if (val.length >= 2) {
    const first = val.charAt(0);
    const last = val.charAt(val.length - 1);
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return val.slice(1, -1);
    }
  }
  return val;
}

function renderEmbedHtml(urlStr: string): string {
  const cleanUrl = unquote(urlStr);
  try {
    const embedResult = embed(cleanUrl, { className: 'docmd-embed' });
    if (embedResult && embedResult.html) {
      return embedResult.html;
    }
    const url = new URL(cleanUrl);
    const hostname = url.hostname.replace('www.', '');
    return `<div class="docmd-embed-fallback"><a href="${cleanUrl}" class="docmd-button docmd-button-external" target="_blank" rel="noopener noreferrer">Open ${hostname} link</a></div>`;
  } catch {
    return `<div class="docmd-embed-fallback"><a href="${cleanUrl}" class="docmd-button docmd-button-external" target="_blank" rel="noopener noreferrer">Open link</a></div>`;
  }
}

const EMBED_REGEX = /^:::\s*embed\s+(?:(?:url:|link:)?(?:"([^"]*)"|'([^']*)'|\[([^\]]+)\]|(\S+)))(?:\s*:::\s*(?:\/embed|\/|)?(?=\s|$))?/i;

function embedRule(state: any, startLine: number, endLine: number, silent: boolean) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();

  // Match: ::: embed [url:]"https://..." [::: /embed]
  const match = lineContent.match(EMBED_REGEX);
  if (!match) return false;
  if (silent) return true;

  const urlStr = match[1] || match[2] || match[3] || match[4] || '';
  if (!urlStr) return false;

  const token = state.push('html_inline', '', 0);
  token.content = renderEmbedHtml(urlStr);

  state.line = startLine + 1;
  return true;
}

function embedInlineRule(state: any, silent: boolean) {
  const start = state.pos;
  const max = state.posMax;

  if (state.src.charCodeAt(start) !== 0x3A /* : */) return false;
  if (state.src.slice(start, start + 3) !== ':::') return false;

  const match = state.src.slice(start, max).match(EMBED_REGEX);
  if (!match) return false;
  if (silent) return true;

  const urlStr = match[1] || match[2] || match[3] || match[4] || '';
  if (!urlStr) return false;

  state.pos += match[0].length;

  const token = state.push('html_inline', '', 0);
  token.content = renderEmbedHtml(urlStr);

  return true;
}

export default {
  name: 'embed',
  setup(md: any) {
    md.block.ruler.before('paragraph', 'docmd_embed', embedRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
    md.inline.ruler.before('text', 'docmd_embed_inline', embedInlineRule);
  }
};