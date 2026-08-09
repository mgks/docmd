import { test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import tooltip from '../dist/features/tooltip.js';

function createParser() {
  const md = new MarkdownIt();
  tooltip.setup(md);
  return md;
}

test('tooltip container: inline ::: tip with explicit term and closing tag', () => {
  const md = createParser();
  const input = 'Built with ::: tip "Zero setup required" term:"Zero-Config" ::: /tip architecture.';
  const html = md.render(input);
  assert.ok(html.includes('<span class="docmd-tooltip" data-tooltip="Zero setup required">Zero-Config</span>'));
});

test('tooltip container: inline ::: tip without explicit term', () => {
  const md = createParser();
  const input = 'Docmd has ::: tip "Zero-configuration" ::: /tip engine.';
  const html = md.render(input);
  assert.ok(html.includes('<span class="docmd-tooltip" data-tooltip="Zero-configuration">Zero-configuration</span>'));
});

test('tooltip container: block container ::: tip', () => {
  const md = createParser();
  const input = `::: tip "Zero-configuration build engine"
Zero-Config
::: /tip`;
  const html = md.render(input);
  assert.ok(html.includes('<span class="docmd-tooltip" data-tooltip="Zero-configuration build engine">'));
  assert.ok(html.includes('Zero-Config'));
  assert.ok(html.includes('</span>'));
});