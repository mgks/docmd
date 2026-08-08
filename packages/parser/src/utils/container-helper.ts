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

/**
 * Strips inline comments (`# ...`) from container header lines.
 * Skips `#` characters inside quotes or hex color / URL parameters.
 */
export function stripContainerComment(str: string): string {
  if (!str) return '';
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !inSingle) inDouble = !inDouble;
    else if (char === "'" && !inDouble) inSingle = !inSingle;
    else if (char === '#' && !inDouble && !inSingle) {
      if (i === 0 || /\s/.test(str[i - 1])) {
        return str.slice(0, i).trim();
      }
    }
  }
  return str.trim();
}

/**
 * Universal container header parser.
 * Supports:
 *  - Inline comments (`# comment`)
 *  - Named key-value pairs (`title:"..."`, `url:"..."`, `icon:code-2`, `color:#ef4444`, `open:true`)
 *  - Positional quoted and unquoted arguments fallback
 *
 * @param info - Raw info string from container header line
 * @param positionalKeys - Key names to map remaining positional arguments to in order
 */
export function parseContainerHeader(info: string, positionalKeys: string[] = ['title', 'url']): Record<string, string> {
  const cleaned = stripContainerComment(info);
  if (!cleaned) return {};

  const result: Record<string, string> = {};

  // 1. Extract named key-values (key:"val", key:'val', key:val)
  const kvRegex = /\b([a-zA-Z0-9_-]+):(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  const remaining = cleaned.replace(kvRegex, (match, key, valDouble, valSingle, valBare) => {
    const val = valDouble !== undefined ? valDouble : (valSingle !== undefined ? valSingle : valBare);
    result[key.toLowerCase()] = val;
    return ' ';
  });

  // 2. Extract remaining quoted or unquoted tokens
  const positionalTokens: string[] = [];
  const tokenRegex = /(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m;
  while ((m = tokenRegex.exec(remaining)) !== null) {
    const token = m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]);
    if (token && token.trim()) {
      positionalTokens.push(token.trim());
    }
  }

  // 3. Map positional tokens to positionalKeys if not already set by named key-values
  let posIdx = 0;
  for (const key of positionalKeys) {
    if (!result[key] && posIdx < positionalTokens.length) {
      result[key] = positionalTokens[posIdx++];
    }
  }

  return result;
}

/**
 * Extracts a quoted title (e.g., "My Title") and an optional icon (e.g., icon:rocket) from a string.
 * This is the standard parser for docmd containers (callouts, cards, tabs, etc.)
 * 
 * @param {string} info - The raw info string to parse
 * @returns {{ title: string, icon: string, url: string }}
 */
export function parseTitleAndIcon(info: string) {
  const parsed = parseContainerHeader(info, ['title', 'url']);
  return {
    title: parsed.title || '',
    icon: parsed.icon || '',
    url: parsed.url || parsed.link || parsed.href || ''
  };
}