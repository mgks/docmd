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
import { processHref } from '../utils/normalize-href.js';

function unquote(value: string): string {
  if (!value) return '';
  if (value.length >= 2) {
    const first = value.charAt(0);
    const last = value.charAt(value.length - 1);
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function cleanLink(raw: string): string {
  let val = unquote(raw);
  if (/^(?:url|link|href):/i.test(val)) {
    val = val.replace(/^(?:url|link|href):/i, '');
    val = unquote(val);
  }
  return val;
}

function parseButtonArgs(rawInput: string): { text: string; link: string; icon: string; color: string } {
  let text = 'Button';
  let link = '';
  let icon = '';
  let color = '';

  const match = rawInput.match(/^\s*(?:["']([^"']+)["']|(\S+))(.*)$/);
  if (!match) return { text, link, icon, color };

  text = match[1] || match[2] || 'Button';
  if (!match[1] && match[2]) text = text.replace(/_/g, ' ');
  const rest = (match[3] || '').trim();

  const optionRegex = /(?:icon|color|style|link|url|href):(?:"[^"]*"|'[^']*'|\S+)/gi;
  const optionsFound: string[] = rest.match(optionRegex) || [];

  for (const opt of optionsFound) {
    if (/^icon:/i.test(opt)) icon = unquote(opt.substring(5));
    else if (/^color:/i.test(opt)) color = unquote(opt.substring(6));
    else if (/^style:/i.test(opt)) color = unquote(opt.substring(6));
    else if (/^(?:link|url|href):/i.test(opt)) link = cleanLink(opt);
  }

  if (!link && rest) {
    const nonOptionRest = rest.replace(optionRegex, '').trim();
    if (nonOptionRest) {
      const positionalMatch = nonOptionRest.match(/^(?:"([^"]*)"|'([^']*)'|(\S+))/);
      if (positionalMatch) {
        link = cleanLink(positionalMatch[1] || positionalMatch[2] || positionalMatch[3] || '');
      }
    }
  }

  return { text, link, icon, color };
}

function renderButtonHtml(text: string, link: string, icon: string, color: string, state: any): string {
  const { href, isExternal } = processHref(link, state);

  let styleAttr = '';
  if (color) {
    styleAttr = ` style="background-color: ${color}; border-color: ${color}; color: #fff;"`;
  }

  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

  let iconHtml = '';
  if (icon) {
    iconHtml = renderIcon(icon, { class: 'button-icon' });
  }

  return `<a href="${href}" class="docmd-button"${styleAttr}${targetAttr}>${iconHtml}${state.md.renderInline(text)}</a>`;
}

function buttonRule(state: any, startLine: number, endLine: number, silent: boolean) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();

  const match = lineContent.match(/^:::\s*button\s+(.*)$/i);
  if (!match) return false;
  if (silent) return true;

  let rest = match[1].trim();
  rest = rest.replace(/\s*:::\s*(?:\/button|\/|)?$/i, '').trim();

  const { text, link, icon, color } = parseButtonArgs(rest);

  const token = state.push('html_inline', '', 0);
  token.content = renderButtonHtml(text, link, icon, color, state);

  state.line = startLine + 1;
  return true;
}

function buttonInlineRule(state: any, silent: boolean) {
  const start = state.pos;
  const max = state.posMax;

  if (state.src.charCodeAt(start) !== 0x3A /* : */) return false;
  if (state.src.slice(start, start + 3) !== ':::') return false;

  const match = state.src.slice(start, max).match(
    /^:::\s*button\s+(.*?)(?:\s*:::\s*(?:\/button|\/|)?(?=\s|$))/i
  );
  if (!match) return false;
  if (silent) return true;

  const { text, link, icon, color } = parseButtonArgs(match[1].trim());

  state.pos += match[0].length;

  const token = state.push('html_inline', '', 0);
  token.content = renderButtonHtml(text, link, icon, color, state);

  return true;
}

export default {
  name: 'buttons',
  setup(md: any) {
    md.block.ruler.before('paragraph', 'docmd_button', buttonRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
    md.inline.ruler.before('text', 'docmd_button_inline', buttonInlineRule);
  }
};