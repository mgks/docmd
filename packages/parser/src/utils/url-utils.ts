/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * @package     @docmd/parser
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

/**
 * Centralised URL Utilities
 * =========================
 *
 * This module is the **single source of truth** for all URL transformations
 * in the docmd ecosystem. Every plugin, template, and engine component
 * MUST use these utilities instead of rolling their own URL logic.
 *
 * Architecture:
 *
 *   User Input (markdown, config)
 *       │
 *       ▼
 *   resolveHref()          ← normalize-href.ts (user-facing href → clean path)
 *       │
 *       ▼
 *   Build Engine            ← generator.ts produces outputPath per page
 *       │
 *       ▼
 *   URL Utilities           ← THIS FILE
 *       │
 *       ├── outputPathToSlug()        → "guide/"
 *       ├── outputPathToCanonical()   → "https://site.com/guide/"
 *       ├── buildContextualUrl()      → "../de/guide/" (relative, context-aware)
 *       ├── sanitizeUrl()             → collapse //, enforce trailing /
 *       └── createUrlContext()        → factory for page-level context
 *
 * Plugins receive pre-computed URLs via the page object, OR can import
 * these utilities directly for custom URL generation.
 */

import { sanitizeUrl } from './normalize-href.js';

// Re-export sanitizeUrl from normalize-href for convenience
export { sanitizeUrl };

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Immutable context object that captures all the environmental factors
 * needed to resolve a URL for a specific page render.
 *
 * Created once per page in generator.ts and passed to all templates
 * and plugin hooks.
 */
export interface UrlContext {
  /** Relative path from current page back to site root, e.g. `../../` or `./` */
  readonly relativePathToRoot: string;
  /** Locale + version prefix for the current build pass, e.g. `de/v1/` or `` */
  readonly outputPrefix: string;
  /** Whether we're generating for offline/file:// browsing */
  readonly offline: boolean;
  /** The site base path from config, e.g. `/docs/` or `/` */
  readonly base: string;
  /** The full site URL from config, e.g. `https://docmd.io` (no trailing slash) */
  readonly siteUrl: string;
}

/**
 * Pre-computed URL data attached to every page object.
 * Plugins can read these directly - zero computation needed.
 */
export interface PageUrls {
  /** Clean directory-style slug, e.g. `guide/` or `/` for root */
  readonly slug: string;
  /** Full canonical URL, e.g. `https://docmd.io/guide/` (only if siteUrl is set) */
  readonly canonical: string;
  /** Relative path from site root, e.g. `/guide/` or `/` */
  readonly pathname: string;
}

// ─── Core Utilities ─────────────────────────────────────────────────

/**
 * Collapse consecutive slashes (except after protocol `:`), enforce
 * consistent formatting. This is the **last-resort safety net** - if
 * the upstream logic is correct, this should be a no-op.
 *
 * Note: This function is imported from normalize-href.ts to ensure
 * single source of truth for URL sanitization logic.
 */

/**
 * Convert a build-engine outputPath to a clean directory-style slug.
 *
 * This is the **single canonical conversion** from the internal file path
 * representation to a URL path segment. Every consumer that previously
 * did its own `outputPath.replace('/index.html', '/')` MUST use this.
 *
 * @param outputPath - e.g. `guide/index.html`, `index.html`, `de/v1/api/index.html`
 * @returns Clean slug, e.g. `guide/`, `/`, `de/v1/api/`
 *
 * @example
 *   outputPathToSlug('guide/index.html')     → 'guide/'
 *   outputPathToSlug('index.html')            → '/'
 *   outputPathToSlug('de/v1/api/index.html')  → 'de/v1/api/'
 *   outputPathToSlug('about.html')            → 'about/'
 */
export function outputPathToSlug(outputPath: string): string {
  if (!outputPath) return '/';

  let slug = outputPath.replace(/\\/g, '/');

  // Strip trailing index.html
  if (slug === 'index.html') return '/';
  if (slug.endsWith('/index.html')) {
    slug = slug.slice(0, -10); // remove 'index.html', keep trailing '/'
  } else if (slug.endsWith('.html')) {
    slug = slug.slice(0, -5) + '/';
  }

  // Ensure trailing slash
  if (slug !== '/' && !slug.endsWith('/')) {
    slug += '/';
  }

  return slug;
}

/**
 * Convert an outputPath to a root-relative pathname (always starts with `/`).
 *
 * @param outputPath - e.g. `guide/index.html`
 * @returns e.g. `/guide/`
 */
export function outputPathToPathname(outputPath: string): string {
  const slug = outputPathToSlug(outputPath);
  return slug.startsWith('/') ? slug : '/' + slug;
}

/**
 * Convert an outputPath to a full canonical URL.
 *
 * @param outputPath - e.g. `guide/index.html`
 * @param siteUrl    - e.g. `https://docmd.io` (no trailing slash)
 * @returns e.g. `https://docmd.io/guide/`
 */
export function outputPathToCanonical(outputPath: string, siteUrl: string): string {
  if (!siteUrl) return '';
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const pathname = outputPathToPathname(outputPath);
  return sanitizeUrl(cleanSiteUrl + pathname);
}

/**
 * Build a context-aware relative URL from a clean href.
 *
 * This replaces ALL inline URL building in EJS templates and the
 * `buildRelativeUrl` function in generator.ts. It is the single
 * function that understands relativePathToRoot, outputPrefix,
 * offline mode, and base path.
 *
 * @param href    - A clean, normalised href (output of resolveHref), e.g. `guide/`, `#section`, `https://...`
 * @param context - The UrlContext for the current page
 * @returns A fully resolved relative URL safe for use in `<a href="...">`
 *
 * @example
 *   // Page at /de/v1/getting-started/index.html
 *   buildContextualUrl('guide/', ctx)
 *   // → '../../de/v1/guide/'  (relative, with locale+version prefix)
 *
 *   buildContextualUrl('#section', ctx)
 *   // → '#section'  (hash-only, untouched)
 *
 *   buildContextualUrl('https://github.com', ctx)
 *   // → 'https://github.com'  (external, untouched)
 */
export function buildContextualUrl(href: string, context: UrlContext): string {
  // Pass-through: empty, hash-only, external protocols, data URIs
  if (!href || href === '#') return href || '#';
  // D-S2: strip the `external:` prefix defensively. Plugin callers may
  // invoke this function directly without going through `resolveHref`
  // first; previously `external:https://...` was treated as a literal
  // path segment and got mangled into `./external:https://...`.
  if (href.startsWith('external:')) {
    href = href.slice('external:'.length);
  }
  if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:')) {
    return href;
  }
  // Hash-only anchors pass through unchanged. Without this guard, a
  // value like `#section` falls through to the path-combining branch
  // and gets prepended with the page's `relativePathToRoot`, producing
  // `./#section` — which a browser still resolves to the same anchor,
  // but breaks expectations for callers that compare the output to the
  // input hash verbatim.
  if (href.startsWith('#')) return href;

  // Separate hash fragment
  let hash = '';
  const hashIdx = href.indexOf('#');
  if (hashIdx >= 0) {
    hash = href.substring(hashIdx);
    href = href.substring(0, hashIdx);
  }

  // Strip leading ./ and / to get a clean relative path
  const cleanPath = href.replace(/^(\.\/|\/)+/, '');

  // Build the prefixed path: outputPrefix (locale/version) + clean path
  const prefixStr = context.outputPrefix ? context.outputPrefix.replace(/\/$/, '') : '';
  let combinedPath = prefixStr
    ? (cleanPath ? prefixStr + '/' + cleanPath : prefixStr + '/')
    : cleanPath;

  // Offline mode: append /index.html for file:// browsing
  if (context.offline && combinedPath !== '' && !combinedPath.endsWith('.html') && !combinedPath.endsWith('/')) {
    combinedPath = combinedPath + '/index.html';
  } else if (context.offline && combinedPath !== '' && combinedPath.endsWith('/')) {
    combinedPath = combinedPath + 'index.html';
  }

  // Build final relative URL
  const result = context.relativePathToRoot + combinedPath + hash;
  return sanitizeUrl(result);
}

/**
 * Create a UrlContext for a specific page render.
 *
 * Called once per page in generator.ts. The resulting context is then
 * passed to all templates and can be forwarded to plugin hooks.
 *
 * @param options - Configuration for this page's URL context
 */
export function createUrlContext(options: {
  relativePathToRoot: string;
  outputPrefix?: string;
  offline?: boolean;
  base?: string;
  siteUrl?: string;
}): UrlContext {
  return Object.freeze({
    relativePathToRoot: options.relativePathToRoot || './',
    outputPrefix: options.outputPrefix || '',
    offline: options.offline || false,
    base: options.base || '/',
    siteUrl: (options.siteUrl || '').replace(/\/+$/, ''),
  });
}

/**
 * Compute pre-built URL data for a page.
 *
 * Called once per page in generator.ts. The resulting PageUrls object
 * is attached to the page object and available to all post-build plugins.
 *
 * @param outputPath - The page's output path, e.g. `guide/index.html`
 * @param siteUrl    - The site URL from config, e.g. `https://docmd.io`
 */
export function computePageUrls(outputPath: string, siteUrl: string): PageUrls {
  return Object.freeze({
    slug: outputPathToSlug(outputPath),
    canonical: outputPathToCanonical(outputPath, siteUrl),
    pathname: outputPathToPathname(outputPath),
  });
}

/**
 * Build an absolute URL from config.base + optional locale + optional version + page path.
 *
 * Used by version-dropdown.ejs and language-switcher.ejs for absolute navigation.
 * Replaces the inline JS computations in those templates.
 *
 * @param base          - config.base, e.g. `/docs/` or `/`
 * @param localePrefix  - e.g. `de/` or `` for default locale
 * @param versionPrefix - e.g. `v1/` or `` for current version
 * @param pagePath      - e.g. `guide/` or ``
 * @returns Absolute path, e.g. `/docs/de/v1/guide/`
 */
export function buildAbsoluteUrl(
  base: string,
  localePrefix: string = '',
  versionPrefix: string = '',
  pagePath: string = ''
): string {
  const normalizedBase = base.endsWith('/') ? base : base + '/';
  const result = normalizedBase + localePrefix + versionPrefix + pagePath;
  return sanitizeUrl(result);
}

/**
 * Normalise the `<base href="...">` tag in a fully-rendered HTML document.
 *
 * The generator is the single source of truth for the `<base>` tag. Templates
 * are NOT allowed to emit one themselves — anything a template emits is
 * stripped here and replaced with the canonical decision:
 *
 *   • offline mode (`--offline`)    → no `<base>` tag (file:// re-roots)
 *   • root deploy (`siteRootAbs === '/'`) → no `<base>` tag (relative URLs
 *                                            resolve against document path)
 *   • subpath deploy (`siteRootAbs !== '/'`) → `<base href="siteRootAbs">`
 *
 * Implementation notes:
 *
 *   • Removes ALL existing `<base>` tags (any source: template, partial,
 *     stray plugin output) using a regex that handles attributes in any
 *     order, self-closing forms, single/double quotes.
 *   • When emitting, inserts the canonical `<base>` immediately after the
 *     `<title>` tag so it applies to all subsequent `<link>`, `<script>`,
 *     and asset references in the document head.
 *   • Idempotent: running it twice is a no-op.
 *
 * Centralising this means old templates (pre-0.8.13 with unconditional
 * `<base href="/">`), the default template, and any third-party template
 * all produce the same correct output. Templates do not need to know about
 * base tags at all.
 *
 * @param html       - The fully-rendered HTML string from the layout template
 * @param isOffline  - Whether the build was invoked with `--offline`
 * @param siteRootAbs - The absolute subpath root, e.g. `'/'`, `'/repo/'`, `'/docs/v1/'`
 * @returns          - The HTML with the canonical `<base>` (or none) in place
 */
export function normaliseBaseTag(html: string, isOffline: boolean, siteRootAbs: string): string {
  // Step 1: strip every existing <base> tag (self-closing or with close, any attribute order)
  const BASE_TAG_RE = /<base\b[^>]*\/?>/gi;
  const cleaned = html.replace(BASE_TAG_RE, '');

  // Step 2: decide whether to emit a canonical one
  if (isOffline) return cleaned;
  if (!siteRootAbs || siteRootAbs === '/') return cleaned;

  // Inject right after <title>...</title>. If no <title> exists, inject before </head>.
  const canonical = `<base href="${escapeHtmlAttr(siteRootAbs)}">`;

  const titleClose = cleaned.match(/<\/title>/i);
  if (titleClose && typeof titleClose.index === 'number') {
    return cleaned.slice(0, titleClose.index + titleClose[0].length)
         + canonical
         + cleaned.slice(titleClose.index + titleClose[0].length);
  }
  const headClose = cleaned.match(/<\/head>/i);
  if (headClose && typeof headClose.index === 'number') {
    return cleaned.slice(0, headClose.index)
         + canonical
         + cleaned.slice(headClose.index);
  }
  // Final fallback: prepend (shouldn't happen for valid HTML)
  return canonical + cleaned;
}

/** Minimal attribute-value escaper for the canonical <base href="...">. */
function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
