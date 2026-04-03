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

/**
 * Source editing tools for live-edit plugins.
 *
 * Plugins interact with rendered output (block IDs, plain-text offsets)
 * and these tools translate those references back to raw markdown source
 * positions so edits can be applied safely.
 */

import fs from 'fs';
import path from 'path';
import { createMarkdownProcessor } from '@docmd/parser';
import type { BlockInfo, InlineSegment, SourceTools, TextLocation } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve and validate a file path against the project root.
 * Throws if the resolved path escapes the project root.
 */
function safePath(projectRoot: string, file: string): string {
  const resolved = path.resolve(projectRoot, file);
  if (!resolved.startsWith(projectRoot + path.sep) && resolved !== projectRoot) {
    throw new Error(`Path "${file}" escapes the project root`);
  }
  return resolved;
}

/**
 * Compute the number of lines occupied by YAML frontmatter (including the
 * trailing blank line that gray-matter strips).  Mirrors the logic used in
 * `processContent` from `@docmd/parser`.
 */
function computeFrontmatterOffset(raw: string): number {
  if (!raw.startsWith('---')) return 0;
  const closingIndex = raw.indexOf('---', 3);
  if (closingIndex === -1) return 0;
  let count = raw.substring(0, closingIndex + 3).split('\n').length;
  if (raw[closingIndex + 3] === '\n') count++;
  return count;
}

// ---------------------------------------------------------------------------
// Inline segment builder
// ---------------------------------------------------------------------------

/**
 * Syntax marker lookup for open/close token pairs.
 * Returns `[before, after]` strings that wrap the text content in raw markdown.
 */
function syntaxForToken(token: any): [string, string] | null {
  switch (token.type) {
    case 'strong_open':
      return ['**', '**'];
    case 'em_open':
      return [token.markup || '*', token.markup || '*'];
    case 's_open':
      return ['~~', '~~'];
    case 'link_open': {
      const href = (token.attrs || []).find((a: string[]) => a[0] === 'href');
      return ['[', `](${href ? href[1] : ''})`];
    }
    default:
      return null;
  }
}

/**
 * Build an array of inline segments from a raw markdown string.
 *
 * Each segment describes a contiguous run of text content and the surrounding
 * syntax markers (if any).  `rawOffset` is the character index in `rawContent`
 * where the segment's *text* starts (after the opening syntax marker).
 */
function buildSegments(rawContent: string, md: any): InlineSegment[] {
  const tokens = md.parseInline(rawContent, {});
  if (!tokens.length || !tokens[0].children) return [];

  const children = tokens[0].children;
  const segments: InlineSegment[] = [];
  const syntaxStack: ([string, string] | null)[] = [];

  // Walk the raw string in parallel with the token stream to compute
  // rawOffset values.  `rawCursor` tracks our position in `rawContent`.
  let rawCursor = 0;

  for (const child of children) {
    if (child.nesting === 1) {
      // Opening tag — advance rawCursor past the opening marker
      const syn = syntaxForToken(child);
      if (syn) {
        const markerPos = rawContent.indexOf(syn[0], rawCursor);
        if (markerPos !== -1) {
          rawCursor = markerPos + syn[0].length;
        }
      }
      syntaxStack.push(syn);
    } else if (child.nesting === -1) {
      // Closing tag — advance rawCursor past the closing marker
      const syn = syntaxStack.pop();
      if (syn) {
        const closeMarker = syn[1];
        const markerPos = rawContent.indexOf(closeMarker, rawCursor);
        if (markerPos !== -1) {
          rawCursor = markerPos + closeMarker.length;
        }
      }
    } else if (child.type === 'code_inline') {
      // Self-contained segment with backtick syntax
      const backtick = child.markup || '`';
      const markerPos = rawContent.indexOf(backtick + child.content + backtick, rawCursor);
      if (markerPos !== -1) {
        segments.push({
          text: child.content,
          rawOffset: markerPos + backtick.length,
          rawLength: child.content.length,
          syntax: [backtick, backtick],
        });
        rawCursor = markerPos + backtick.length + child.content.length + backtick.length;
      }
    } else if (child.type === 'softbreak') {
      // Treat as newline in text content — skip in raw
      const nlPos = rawContent.indexOf('\n', rawCursor);
      if (nlPos !== -1) rawCursor = nlPos + 1;
    } else if (child.type === 'text') {
      // Plain text or text inside a syntax wrapper
      const textPos = rawContent.indexOf(child.content, rawCursor);
      const currentSyntax = syntaxStack.length > 0 ? syntaxStack[syntaxStack.length - 1] : null;
      if (textPos !== -1) {
        segments.push({
          text: child.content,
          rawOffset: textPos,
          rawLength: child.content.length,
          syntax: currentSyntax,
        });
        rawCursor = textPos + child.content.length;
      }
    }
  }

  return segments;
}

/**
 * Build plain text content from segments (concatenated segment texts).
 */
function plainTextFromSegments(segments: InlineSegment[]): string {
  return segments.map((s) => s.text).join('');
}

/**
 * Resolve a `textOffset` (character position in plain text) to the segment
 * that contains it.
 */
function resolveCursor(
  segments: InlineSegment[],
  textOffset: number,
): (InlineSegment & { segment: number }) | null {
  let accumulated = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (accumulated + seg.text.length > textOffset) {
      return { segment: i, ...seg };
    }
    accumulated += seg.text.length;
  }
  // If offset is exactly at the end, return the last segment
  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    return { segment: segments.length - 1, ...last };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a source-tools instance bound to the given project root.
 *
 * All file paths passed to the returned methods are resolved relative to
 * `projectRoot` and validated against path traversal.
 */
export function createSourceTools({ projectRoot }: { projectRoot: string }): SourceTools & { _modified: boolean } {
  // Normalise projectRoot to an absolute path without trailing separator
  projectRoot = path.resolve(projectRoot);

  // Create a markdown-it instance once (no dev features needed for parsing)
  const md = createMarkdownProcessor({ isDev: false });

  const tools: SourceTools & { _modified: boolean } = {
    _modified: false,

    // -------------------------------------------------------------------
    // getBlockAt
    // -------------------------------------------------------------------
    async getBlockAt(
      file: string,
      blockRef: [number, number],
      options?: { textOffset?: number },
    ): Promise<BlockInfo> {
      const filePath = safePath(projectRoot, file);
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const fmOffset = computeFrontmatterOffset(raw);

      const [startLine, endLine] = blockRef;
      const absStart = fmOffset + startLine;
      const absEnd = fmOffset + endLine;

      const allLines = raw.split('\n');
      const blockLines = allLines.slice(absStart, absEnd);
      const rawBlock = blockLines.join('\n');

      const segments = buildSegments(rawBlock, md);
      const textContent = plainTextFromSegments(segments);

      let cursor: (InlineSegment & { segment: number }) | null = null;
      if (options && options.textOffset != null) {
        cursor = resolveCursor(segments, options.textOffset);
      }

      return {
        id: null,
        line: { start: absStart, end: absEnd },
        raw: rawBlock,
        textContent,
        segments,
        cursor,
        ancestors: [],
      };
    },

    // -------------------------------------------------------------------
    // findText
    // -------------------------------------------------------------------
    async findText(
      file: string,
      blockRef: [number, number],
      text: string,
      textOffset?: number,
    ): Promise<TextLocation | null> {
      const block = await tools.getBlockAt(file, blockRef, { textOffset });

      // Find the segment containing the target text
      let accumulated = 0;
      for (const seg of block.segments) {
        const idx = seg.text.indexOf(text);
        if (idx !== -1 && accumulated + idx >= (textOffset != null ? textOffset : 0) - seg.text.length) {
          const rawStartInBlock = seg.rawOffset + idx;
          const rawEndInBlock = rawStartInBlock + text.length;

          const filePath = safePath(projectRoot, file);
          const raw = await fs.promises.readFile(filePath, 'utf8');
          const fmOffset = computeFrontmatterOffset(raw);
          const absLine = fmOffset + blockRef[0];

          return {
            line: absLine,
            startCol: rawStartInBlock,
            endCol: rawEndInBlock,
            rawText: text,
            wrappingSyntax: {
              before: seg.syntax ? seg.syntax[0] : null,
              after: seg.syntax ? seg.syntax[1] : null,
            },
          };
        }
        accumulated += seg.text.length;
      }
      return null;
    },

    // -------------------------------------------------------------------
    // wrapText
    // -------------------------------------------------------------------
    async wrapText(
      file: string,
      blockRef: [number, number],
      text: string,
      textOffset: number,
      before: string,
      after: string,
    ): Promise<void> {
      const loc = await tools.findText(file, blockRef, text, textOffset);
      if (!loc) throw new Error(`Text "${text}" not found in block`);

      const filePath = safePath(projectRoot, file);
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const allLines = raw.split('\n');

      const line = allLines[loc.line];
      const newLine =
        line.substring(0, loc.startCol) +
        before +
        line.substring(loc.startCol, loc.endCol) +
        after +
        line.substring(loc.endCol);

      allLines[loc.line] = newLine;
      await fs.promises.writeFile(filePath, allLines.join('\n'));
      tools._modified = true;
    },

    // -------------------------------------------------------------------
    // insertAfter
    // -------------------------------------------------------------------
    async insertAfter(
      file: string,
      blockRef: [number, number],
      content: string,
    ): Promise<void> {
      const filePath = safePath(projectRoot, file);
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const fmOffset = computeFrontmatterOffset(raw);
      const absEnd = fmOffset + blockRef[1];

      const allLines = raw.split('\n');

      // Insert content after the block with blank line padding
      const insertLines = ['', ...content.split('\n')];
      allLines.splice(absEnd, 0, ...insertLines);

      await fs.promises.writeFile(filePath, allLines.join('\n'));
      tools._modified = true;
    },

    // -------------------------------------------------------------------
    // replaceBlock
    // -------------------------------------------------------------------
    async replaceBlock(
      file: string,
      blockRef: [number, number],
      content: string,
    ): Promise<void> {
      const filePath = safePath(projectRoot, file);
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const fmOffset = computeFrontmatterOffset(raw);

      const absStart = fmOffset + blockRef[0];
      const absEnd = fmOffset + blockRef[1];

      const allLines = raw.split('\n');
      const replacementLines = content.split('\n');
      allLines.splice(absStart, absEnd - absStart, ...replacementLines);

      await fs.promises.writeFile(filePath, allLines.join('\n'));
      tools._modified = true;
    },

    // -------------------------------------------------------------------
    // removeBlock
    // -------------------------------------------------------------------
    async removeBlock(
      file: string,
      blockRef: [number, number],
    ): Promise<void> {
      const filePath = safePath(projectRoot, file);
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const fmOffset = computeFrontmatterOffset(raw);

      const absStart = fmOffset + blockRef[0];
      const absEnd = fmOffset + blockRef[1];

      const allLines = raw.split('\n');

      // Remove the block lines
      allLines.splice(absStart, absEnd - absStart);

      // Clean up consecutive blank lines around the removal point
      let i = absStart;
      while (i < allLines.length - 1 && allLines[i].trim() === '' && allLines[i + 1].trim() === '') {
        allLines.splice(i, 1);
      }

      await fs.promises.writeFile(filePath, allLines.join('\n'));
      tools._modified = true;
    },
  };

  return tools;
}
