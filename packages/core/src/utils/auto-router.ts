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

import fs from 'fs';
import path from 'path';
import { normalizeInternalHref } from '@docmd/parser';

/**
 * Convert a file/folder name to a URL-safe slug.
 * Replaces spaces and URL-unsafe characters with hyphens so that the
 * generated nav link, the output file path, and the browser URL all agree.
 *
 * Examples:
 *   "folder with space"  → "folder-with-space"
 *   "my file (draft)"   → "my-file-draft"
 *   "already-slug_ok"   → "already-slug_ok"  (no change)
 */
function slugifySegment(name: string): string {
  return name
    .replace(/\s+/g, '-')               // spaces → hyphens
    .replace(/[^a-zA-Z0-9\-_.~]/g, '-') // unsafe URL chars → hyphens
    .replace(/-{2,}/g, '-')             // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '')            // strip leading/trailing hyphens
    || name;                             // fallback: keep original if result is empty
}

// Extract title from Frontmatter or H1 without loading heavy parsers
function extractTitleFromFile(filePath: string, filename: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Try YAML frontmatter title
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const titleMatch = fmMatch[1].match(/^title:\s*"?([^"\n]+)"?/m);
      if (titleMatch) return titleMatch[1].trim();
    }

    // 2. Try H1
    const h1Match = content.match(/^#\s+(.*)/m);
    if (h1Match) return h1Match[1].trim();

  } catch { /* ignore parser errors */ }

  // 3. Fallback: Prettify Filename
  // "index copy.md" -> "Index Copy"
  const cleanName = filename.replace(/\.(md|ejs)$/i, '');
  // Capitalize first letter of each word
  return cleanName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Recursively builds the navigation array for Zero Config mode.
 */
export function buildAutoNav(dir: string, basePath = '/'): any[] { // Default base path is root '/'
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const nav: any[] = [];

  // Handle index.md/index.ejs (or README.md if no index.md) -> maps to the folder root
  const hasIndex = items.some(i => /^index\.(md|ejs)$/i.test(i.name));
  const hasReadme = items.some(i => i.name.toLowerCase() === 'readme.md');
  const indexExists = hasIndex || hasReadme;

  for (const item of items) {
    // Skip hidden files, node_modules, and typical output/asset dirs
    if (
      item.name.startsWith('.') ||
      item.name === '_playground' ||
      item.name === 'node_modules' ||
      item.name === 'assets' ||
      item.name === 'site' ||
      item.name === 'dist' ||
      item.name === 'bin' ||
      item.name === 'src' ||
      item.name === 'lib' ||
      item.name === 'test' ||
      item.name === 'tests' ||
      item.name === 'coverage' ||
      item.name === 'scripts' ||
      item.name === 'temp' ||
      item.name === 'tmp' ||
      item.name === 'build' ||
      item.name === 'vendor'
    ) continue;

    const fullPath = path.join(dir, item.name);

    // Construct URL path: basePath + slugified filename.
    // Slugify so that spaces and URL-unsafe characters are replaced with hyphens,
    // keeping the nav link, output file path, and browser URL consistent.
    const safeBase = basePath.endsWith('/') ? basePath : basePath + '/';
    const relPath = safeBase + slugifySegment(item.name);

    if (item.isDirectory()) {
      const children = buildAutoNav(fullPath, relPath);
      if (children.length > 0) {
        const relPathWithSlash = relPath.endsWith('/') ? relPath : relPath + '/';
        const indexChildIndex = children.findIndex(c => c.path === relPath || c.path === relPathWithSlash);

        let folderPath: string | undefined = undefined;
        if (indexChildIndex >= 0) {
          folderPath = children[indexChildIndex].path;
          children.splice(indexChildIndex, 1);
        }

        const title = item.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (children.length === 0 && folderPath) {
          nav.push({
            title,
            path: folderPath
          });
        } else {
          const navItem: any = {
            title,
            collapsible: true,
            children
          };
          if (folderPath) {
            navItem.path = folderPath;
          }
          nav.push(navItem);
        }
      }
    } else if (item.isFile() && /\.(md|ejs)$/i.test(item.name)) {
      const title = extractTitleFromFile(fullPath, item.name);

      let linkPath = relPath;

      const isIndex = /^index\.(md|ejs)$/i.test(item.name);
      const isReadme = item.name.toLowerCase() === 'readme.md';

      if (isIndex || (isReadme && !hasIndex)) {
        linkPath = basePath === '/' ? '/' : normalizeInternalHref(basePath);
      } else {
        // Use centralised normaliser for clean URLs with trailing slash
        linkPath = normalizeInternalHref(linkPath);
      }

      nav.push({ title, path: linkPath });
    }
  }

  // Sort: Put index.md (Home) at the top, then sort alphabetically
  return nav.sort((a, b) => {
    // Check if path effectively points to current folder root
    const aIsRoot = a.path === basePath || a.path === basePath + '/' || a.path === '' || a.path === '/';
    const bIsRoot = b.path === basePath || b.path === basePath + '/' || b.path === '' || b.path === '/';

    if (aIsRoot && !bIsRoot) return -1;
    if (!aIsRoot && bIsRoot) return 1;

    // Folders usually come after files in some docs, or before. 
    // Let's standard: Files (Home) -> Folders -> Other Files
    const aIsDir = !!a.children;
    const bIsDir = !!b.children;

    if (aIsDir && !bIsDir) return 1;
    if (!aIsDir && bIsDir) return -1;

    return a.title.localeCompare(b.title);
  });
}