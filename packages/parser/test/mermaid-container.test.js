import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '../dist/index.js';
import { markdownSetup } from '../../plugins/mermaid/dist/index.js';

function createProcessorWithMermaid() {
  const processor = createMarkdownProcessor();
  markdownSetup(processor);
  return processor;
}

test('mermaid container: basic diagram rendering', () => {
  const md = `::: mermaid
graph TD
    A --> B
::: /mermaid`;

  const html = createProcessorWithMermaid().render(md);
  assert.ok(html.includes('<div class="docmd-container mermaid-container align-center">'));
  assert.ok(html.includes('<div class="mermaid">graph TD\n    A --&gt; B</div>'));
});

test('mermaid container: title, icon, align and attributes', () => {
  const md = `::: mermaid title:"Architecture Diagram" icon:network align:center zoom:true theme:dark # main diagram
graph LR
    Client --> Server
::: /mermaid`;

  const html = createProcessorWithMermaid().render(md);
  assert.ok(html.includes('data-title="Architecture Diagram"'));
  assert.ok(html.includes('data-theme="dark"'));
  assert.ok(html.includes('data-zoom="true"'));
  assert.ok(html.includes('<div class="mermaid-title">'));
  assert.ok(html.includes('Architecture Diagram</div>'));
  assert.ok(html.includes('<div class="mermaid">graph LR\n    Client --&gt; Server</div>'));
});

test('mermaid plugin disabled: ::: mermaid container does NOT render diagram div', () => {
  const md = `::: mermaid
graph TD
    A --> B
::: /mermaid`;

  // Without calling markdownSetup from @docmd/plugin-mermaid
  const html = createMarkdownProcessor().render(md);
  assert.ok(!html.includes('<div class="docmd-container mermaid-container'));
  assert.ok(!html.includes('<div class="mermaid">'));
});