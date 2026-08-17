/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * sanitizeUrl — slash-collapsing safety net.
 *
 * Regression coverage for a leading `//` collapsing to a single `/`.
 * A leading `//host/path` is a protocol-relative URL: a browser resolves
 * it against the current *scheme* but a *different host*, so an accidental
 * `//search/` (produced by `base` + `/search`, base normalised to `/`)
 * would navigate to `https://search/` instead of the same-site `/search/`.
 * The scheme separator in a real absolute URL (`https://`) must survive.
 *
 * Run: `pnpm --filter @docmd/parser test`
 * --------------------------------------------------------------------
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUrl } from '../dist/index.js';

test('sanitizeUrl collapses a leading // (protocol-relative) to /', () => {
  assert.equal(sanitizeUrl('//search/'), '/search/');
  assert.equal(sanitizeUrl('//docs//guide/'), '/docs/guide/');
});

test('sanitizeUrl collapses interior and trailing runs of slashes', () => {
  assert.equal(sanitizeUrl('/a///b////c/'), '/a/b/c/');
  assert.equal(sanitizeUrl('/guide/'), '/guide/');
});

test('sanitizeUrl preserves the scheme:// separator', () => {
  assert.equal(sanitizeUrl('https://a.com//b'), 'https://a.com/b');
  assert.equal(sanitizeUrl('https://x.com/a/b/'), 'https://x.com/a/b/');
  assert.equal(sanitizeUrl('http://h//a//b'), 'http://h/a/b');
  assert.equal(sanitizeUrl('ws://h//x'), 'ws://h/x');
});

test('sanitizeUrl leaves clean relative paths untouched', () => {
  assert.equal(sanitizeUrl('../de/guide/'), '../de/guide/');
  assert.equal(sanitizeUrl(''), '');
});

test('a browser resolves the sanitised path against the current host', () => {
  // The whole point of the fix: `//search/` would resolve cross-host.
  const href = sanitizeUrl('//search/');
  assert.equal(new URL(href, 'https://example.com/docs/').href, 'https://example.com/search/');
});
