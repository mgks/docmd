/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * Plugin AI disable regression tests (Issue #209)
 *
 * Covers:
 *   - Setting `plugins.ai.assistant: false` (or `enabled: false` / `chat: false`)
 *     properly disables emitting docmd-ai.js / docmd-ai.css assets.
 *   - The generated HTML contains no AI Assistant scripts or stylesheet links.
 *   - When enabled, assets and tags are properly emitted.
 * --------------------------------------------------------------------
 */

import {
  DOCMD,
  setup,
  writeFile,
  build,
  runTestFile
} from '../shared.js';
import fs from 'node:fs';
import path from 'path';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    failures.push(message);
    console.log(`    ❌ ${message}`);
  } else {
    passed++;
    console.log(`    ✅ ${message}`);
  }
}

export const test = runTestFile({
  name: 'Plugin AI disable flags (Issue #209)',
  emoji: '🤖',
  run: async () => {
    // Case 1: plugins.ai.assistant: false -> No AI assets emitted or injected
    {
      const proj = setup('plugin-ai-disable-assistant-false');
      writeFile(proj, 'docs/index.md', '# Hello World\nWelcome to docs.\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'AI Disabled Test',
        src: './docs',
        out: './site',
        plugins: {
          ai: {
            assistant: false
          }
        }
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'Build succeeds when plugins.ai.assistant is false');
      assert(!fs.existsSync(path.join(proj, 'site/assets/js/docmd-ai.js')),
        'site/assets/js/docmd-ai.js is NOT emitted when assistant is false');
      assert(!fs.existsSync(path.join(proj, 'site/assets/css/docmd-ai.css')),
        'site/assets/css/docmd-ai.css is NOT emitted when assistant is false');

      const html = fs.readFileSync(path.join(proj, 'site/index.html'), 'utf8');
      assert(!html.includes('docmd-ai.js'), 'HTML contains no docmd-ai.js script tag');
      assert(!html.includes('docmd-ai.css'), 'HTML contains no docmd-ai.css link tag');
      assert(!html.includes('window.__docmd_ai_config'), 'HTML contains no window.__docmd_ai_config');
      assert(!result.output.includes('AI Assistant plugin ready for site.'),
        'Build output does not log "AI Assistant plugin ready for site." when disabled');
    }

    // Case 2: plugins.ai.enabled: false -> No AI assets emitted or injected
    {
      const proj = setup('plugin-ai-disable-enabled-false');
      writeFile(proj, 'docs/index.md', '# Hello World\nWelcome to docs.\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'AI Enabled False Test',
        src: './docs',
        out: './site',
        plugins: {
          ai: {
            enabled: false
          }
        }
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'Build succeeds when plugins.ai.enabled is false');
      assert(!fs.existsSync(path.join(proj, 'site/assets/js/docmd-ai.js')),
        'site/assets/js/docmd-ai.js is NOT emitted when enabled is false');
      assert(!fs.existsSync(path.join(proj, 'site/assets/css/docmd-ai.css')),
        'site/assets/css/docmd-ai.css is NOT emitted when enabled is false');

      const html = fs.readFileSync(path.join(proj, 'site/index.html'), 'utf8');
      assert(!html.includes('docmd-ai.js'), 'HTML contains no docmd-ai.js script tag');
      assert(!html.includes('docmd-ai.css'), 'HTML contains no docmd-ai.css link tag');
    }

    // Case 3: plugins.ai: {} (enabled by default when configured)
    {
      const proj = setup('plugin-ai-enabled-default');
      writeFile(proj, 'docs/index.md', '# Hello World\nWelcome to docs.\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'AI Enabled Test',
        src: './docs',
        out: './site',
        plugins: {
          ai: {
            projectId: 'test-project'
          }
        }
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'Build succeeds when AI plugin is enabled');
      assert(fs.existsSync(path.join(proj, 'site/assets/js/docmd-ai.js')),
        'site/assets/js/docmd-ai.js IS emitted when AI plugin is enabled');
      assert(fs.existsSync(path.join(proj, 'site/assets/css/docmd-ai.css')),
        'site/assets/css/docmd-ai.css IS emitted when AI plugin is enabled');

      const html = fs.readFileSync(path.join(proj, 'site/index.html'), 'utf8');
      assert(html.includes('docmd-ai.js'), 'HTML contains docmd-ai.js script tag when enabled');
      assert(html.includes('docmd-ai.css'), 'HTML contains docmd-ai.css link tag when enabled');
      assert(html.includes('window.__docmd_ai_config'), 'HTML contains window.__docmd_ai_config when enabled');
    }

    return { passed, failed, failures };
  }
});

export const results = {
  get passed() { return passed; },
  get failed() { return failed; },
  get failures() { return [...failures]; }
};
