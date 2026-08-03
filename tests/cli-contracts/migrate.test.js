/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * N-3 — `docmd migrate` accepts `--dry-run` for both source migrations
 * and `--upgrade`. Dry-run prints what would change and exits 0
 * without writing.
 *
 * Before the fix, the flag did not exist and there was no way to
 * preview a migration before committing to it.
 *
 * Run: `node tests/runner.js --only=migrate`
 * --------------------------------------------------------------------
 */

import {
  DOCMD,
  setup,
  writeFile,
  runTestFile
} from '../shared.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
  name: 'Migrate --dry-run is non-destructive (N-3)',
  emoji: '🧪',
  run: () => {

    // N-3 — source migration dry-run: mkdocs source, dry-run must NOT
    // create a backup directory or move any files, and must NOT write
    // docmd.config.js.
    {
      const dir = setup('migrate-30-n3-mkdocs-dry-run');
      writeFile(dir, 'mkdocs.yml', 'site_name: N3 Site\n');
      writeFile(dir, 'index.md', '# P1\n');
      writeFile(dir, 'docs/page.md', '# P2\n');

      let output = '';
      let code = -1;
      try {
        output = execSync(`node ${DOCMD} migrate --mkdocs --dry-run`, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
        code = 0;
      } catch (e) {
        output = (typeof e.stdout === 'string' ? e.stdout : '') +
                 (typeof e.stderr === 'string' ? e.stderr : '');
        code = e.status == null ? -1 : e.status;
      }

      assert(code === 0, 'N-3: mkdocs dry-run exits 0');
      assert(/dry run: mkdocs migration/i.test(output), 'N-3: dry-run header mentions MkDocs');
      assert(/Would move/.test(output), 'N-3: dry-run lists files that would be moved');
      assert(/Would write/.test(output), 'N-3: dry-run mentions docmd.config.js');
      assert(/No changes made/.test(output), 'N-3: dry-run prints "No changes made"');

      // Original files must still exist unchanged.
      assert(fs.existsSync(path.join(dir, 'mkdocs.yml')), 'N-3: mkdocs.yml still exists after dry-run');
      assert(fs.existsSync(path.join(dir, 'index.md')), 'N-3: index.md still exists after dry-run');
      assert(fs.existsSync(path.join(dir, 'docs', 'page.md')), 'N-3: docs/page.md still exists after dry-run');
      // Backup directory must NOT exist.
      assert(!fs.existsSync(path.join(dir, 'mkdocs-backup')), 'N-3: no mkdocs-backup created during dry-run');
      // docmd.config.js must NOT exist.
      assert(!fs.existsSync(path.join(dir, 'docmd.config.js')), 'N-3: no docmd.config.js written during dry-run');
    }

    // N-3 — upgrade dry-run: must print the upgraded config and NOT
    // overwrite the original file.
    {
      const dir = setup('migrate-30-n3-upgrade-dry-run');
      const legacyConfig = {
        siteTitle: 'Legacy Site',
        srcDir: './docs',
        outputDir: './out',
        siteUrl: 'https://example.com',
        defaultLocale: 'en'
      };
      writeFile(dir, 'docmd.config.json', JSON.stringify(legacyConfig, null, 2) + '\n');
      const beforeBytes = fs.readFileSync(path.join(dir, 'docmd.config.json'));

      let output = '';
      let code = -1;
      try {
        output = execSync(`node ${DOCMD} migrate --upgrade --dry-run`, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
        code = 0;
      } catch (e) {
        output = (typeof e.stdout === 'string' ? e.stdout : '') +
                 (typeof e.stderr === 'string' ? e.stderr : '');
        code = e.status == null ? -1 : e.status;
      }

      assert(code === 0, 'N-3: upgrade dry-run exits 0');
      assert(/dry run: config upgrade/i.test(output), 'N-3: dry-run header mentions config upgrade');
      assert(/"title":\s*"Legacy Site"/.test(output), 'N-3: dry-run shows upgraded title');
      assert(/"url":/.test(output), 'N-3: dry-run shows upgraded url');

      const afterBytes = fs.readFileSync(path.join(dir, 'docmd.config.json'));
      assert(Buffer.compare(beforeBytes, afterBytes) === 0, 'N-3: original config file unchanged after upgrade dry-run');
    }

    // N-4 — upgrade covers the full legacy-key map. Run a real (non
    // dry-run) upgrade on a config that exercises every legacy key
    // and assert the upgraded file contains the new keys and does
    // NOT contain the old ones.
    {
      const dir = setup('migrate-30-n4-upgrade-coverage');
      writeFile(dir, 'docmd.config.json', JSON.stringify({
        siteTitle: 'Legacy',
        source: './md',
        outDir: './public',
        nav: [{ label: 'Home', path: '/' }],
        search: true,
        sidebar: { position: 'left' },
        theme: { defaultMode: 'dark', enableModeToggle: false, positionMode: 'bottom' }
      }, null, 2) + '\n');

      execSync(`node ${DOCMD} migrate --upgrade`, { cwd: dir, stdio: 'pipe' });

      const after = JSON.parse(fs.readFileSync(path.join(dir, 'docmd.config.json'), 'utf8'));
      assert(after.title === 'Legacy', 'N-4: siteTitle → title');
      assert(after.src === './md', 'N-4: source → src');
      assert(after.out === './public', 'N-4: outDir → out');
      assert(Array.isArray(after.navigation), 'N-4: nav → navigation (array preserved)');
      assert(after.plugins?.search !== undefined, 'N-4: top-level search → plugins.search');
      assert(after.layout?.sidebar?.position === 'left', 'N-4: top-level sidebar → layout.sidebar');
      assert(after.theme?.appearance === 'dark', 'N-4: theme.defaultMode → theme.appearance');
      assert(after.optionsMenu?.components?.themeSwitch === false, 'N-4: theme.enableModeToggle → optionsMenu.components.themeSwitch');
      assert(after.optionsMenu?.position === 'sidebar-bottom', 'N-4: theme.positionMode → optionsMenu.position');

      // Old keys must be gone.
      assert(after.siteTitle === undefined, 'N-4: old siteTitle key removed');
      assert(after.source === undefined, 'N-4: old source key removed');
      assert(after.outDir === undefined, 'N-4: old outDir key removed');
      assert(after.nav === undefined, 'N-4: old nav key removed');
      assert(after.search === undefined, 'N-4: old top-level search key removed');
      assert(after.sidebar === undefined, 'N-4: old top-level sidebar key removed');
      assert(after.theme?.defaultMode === undefined, 'N-4: old theme.defaultMode removed');
      assert(after.theme?.enableModeToggle === undefined, 'N-4: old theme.enableModeToggle removed');
      assert(after.theme?.positionMode === undefined, 'N-4: old theme.positionMode removed');
    }
  }
});

export const results = {
  get passed() { return passed; },
  get failed() { return failed; },
  get failures() { return [...failures]; }
};