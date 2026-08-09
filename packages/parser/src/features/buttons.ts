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

import { renderIcon } from '../utils/icon-renderer.js';
import { resolveHref } from '../utils/normalize-href.js';

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value.charAt(0);
    const last = value.charAt(value.length - 1);
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function processHref(rawLink: string, state: any): { href: string; isExternal: boolean } {
  const result = resolveHref(rawLink);
  let href = result.href;

  if (!result.isRaw && !result.isExternal && !href.startsWith('#')) {
    let hashPart = '';
    let pathPart = href;
    const hashIdx = href.indexOf('#');
    if (hashIdx >= 0) {
      hashPart = href.substring(hashIdx);
      pathPart = href.substring(0, hashIdx);
    }

    const isProtocol = pathPart.match(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i);
    if (!isProtocol && !pathPart.startsWith('/') && state.env && state.env.isIndex === false) {
      if (pathPart.startsWith('./')) {
        pathPart = '../' + pathPart.substring(2);
      } else if (pathPart !== '') {
        pathPart = '../' + pathPart;
      }
    }

    href = pathPart + hashPart;
  }

  return { href, isExternal: result.isExternal };
}

function buttonRule(state: any, startLine: number, endLine: number, silent: boolean) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();

  // Regex matches: ::: button "Text" Link [options] [::: /button]
  const match = lineContent.match(
    /^:::\s*button\s+(?:["'](.*?)["']|(\S+))\s+(?:(url:|link:)?(?:"([^"]*)"|'([^']*)'|(\S+)))(.*)$/i
  );

  if (!match) return false;
  if (silent) return true;

  let text = match[1] || match[2] || 'Button';
  if (match[2]) text = text.replace(/_/g, ' ');

  const rawLink = unquote(match[4] || match[5] || match[6] || match[3] || '');
  let rest = (match[7] || '').trim();

  // Strip trailing optional closing ::: /button or :::
  rest = rest.replace(/\s*:::\s*(?:\/button|\/|)?$/i, '').trim();

  let color = '';
  let icon = '';

  const parts = rest.split(/\s+/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith('color:')) color = unquote(p.substring(6));
    else if (p.startsWith('icon:')) icon = unquote(p.substring(5));
  }

  const { href, isExternal } = processHref(rawLink, state);

  const token = state.push('html_inline', '', 0);

  let styleAttr = '';
  if (color) {
    styleAttr = ` style="background-color: ${color}; border-color: ${color}; color: #fff;"`;
  }

  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

  let iconHtml = '';
  if (icon) {
    iconHtml = renderIcon(icon, { class: 'button-icon' });
  }

  token.content = `<a href="${href}" class="docmd-button"${styleAttr}${targetAttr}>${iconHtml}${state.md.renderInline(text)}</a>`;

  state.line = startLine + 1;
  return true;
}

function buttonInlineRule(state: any, silent: boolean) {
  const start = state.pos;
  const max = state.posMax;

  if (state.src.charCodeAt(start) !== 0x3A /* : */) return false;
  if (state.src.slice(start, start + 3) !== ':::') return false;

  const match = state.src.slice(start, max).match(
    /^:::\s*button\s+(?:["'](.*?)["']|(\S+))\s+(?:(?:url:|link:)?(?:"([^"]*)"|'([^']*)'|(\S+)))((?:\s+(?:color|icon|style):(?:"[^"]*"|'[^']*'|\S+))*)(?:\s*:::\s*(?:\/button|\/|)?(?=\s|$))?/i
  );

  if (!match) return false;
  if (silent) return true;

  let text = match[1] || match[2] || 'Button';
  if (match[2]) text = text.replace(/_/g, ' ');

  const rawLink = unquote(match[3] || match[4] || match[5] || '');
  const optionsStr = match[6] || '';

  let color = '';
  let icon = '';

  const parts = optionsStr.trim().split(/\s+/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith('color:')) color = unquote(p.substring(6));
    else if (p.startsWith('icon:')) icon = unquote(p.substring(5));
  }

  const { href, isExternal } = processHref(rawLink, state);

  state.pos += match[0].length;

  const token = state.push('html_inline', '', 0);

  let styleAttr = '';
  if (color) {
    styleAttr = ` style="background-color: ${color}; border-color: ${color}; color: #fff;"`;
  }

  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

  let iconHtml = '';
  if (icon) {
    iconHtml = renderIcon(icon, { class: 'button-icon' });
  }

  token.content = `<a href="${href}" class="docmd-button"${styleAttr}${targetAttr}>${iconHtml}${state.md.renderInline(text)}</a>`;

  return true;
}

export default {
  name: 'buttons',
  setup(md: any) {
    md.block.ruler.before('paragraph', 'docmd_button', buttonRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
    md.inline.ruler.before('text', 'docmd_button_inline', buttonInlineRule);
  }
};