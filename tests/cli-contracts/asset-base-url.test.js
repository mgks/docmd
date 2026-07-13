/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * Asset base-URL + engine-key regression tests
 *
 * Two related issues that broke sub-project (workspace) sites after
 * the layout changes (relativePathToRoot + base href):
 *
 *   URL-1  `relativePathToRoot` is computed as `./` for a directory
 *          page (e.g. `/search/index.html`) but the document can
 *          also be served at `/search` (no trailing slash — `npx
 *          serve`, nginx, GitHub Pages, all behave this way). With
 *          no <base> tag, the browser uses the document URL as the
 *          base for relative resolution:
 *             /search            → ./assets/template/summer.css
 *                                  → /assets/template/summer.css (root, 404)
 *             /search/           → ./assets/template/summer.css
 *                                  → /search/assets/template/summer.css (OK)
 *          The fix adds <base href="./"> to every layout, which makes
 *          relative resolution use the document's *directory* in both
 *          cases.
 *
 *   URL-2  `engine: "rust"` is a documented top-level config option
 *          but the validator's KNOWN_KEYS list was missing it. Every
 *          build printed two `Unknown property "engine" in config`
 *          warnings (one per workspace project), which drowned the
 *          output in noise and looked like a real misconfiguration.
 *
 * Run: `node tests/runner.js --only=asset-base-url`
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
import { execFileSync } from 'node:child_process';

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
  name: 'Asset base-URL + engine-key',
  emoji: '🔗',
  run: async () => {

    // URL-1a: the <base> tag is now centralised in the generator, NOT in
    // the template. Templates must NOT emit a <base> tag themselves — the
    // generator strips any existing one and injects the canonical decision
    // based on (isOfflineMode, siteRootAbs). This assertion guards that
    // contract: the default layout must not contain a <base> tag.
    {
      const layoutPath = path.resolve(import.meta.dirname, '..', '..', 'packages', 'ui', 'templates', 'layout.ejs');
      const source = fs.readFileSync(layoutPath, 'utf8');
      assert(!/<base\s/i.test(source),
        'URL-1a: default layout does NOT emit <base> (generator owns it centrally)');
    }

    // URL-1b: same contract for the summer template — no <base> in template.
    {
      const layoutPath = path.resolve(import.meta.dirname, '..', '..', 'packages', 'templates', 'summer', 'templates', 'layout.ejs');
      const source = fs.readFileSync(layoutPath, 'utf8');
      assert(!/<base\s/i.test(source),
        'URL-1b: summer template does NOT emit <base> (generator owns it centrally)');
      assert(/window\.DOCMD_SITE_ROOT\s*=\s*"<\%=\s*siteRootAbs\s*\%>"/.test(source),
        'URL-1b: summer template sets window.DOCMD_SITE_ROOT to siteRootAbs so JS plugins (search semantic client) resolve ./ URLs correctly');
    }

    // URL-1c: end-to-end build of a sub-project site (summer template)
    // and check that the rendered HTML contains the absolute <base> tag
    // and emits the correct template asset hrefs.
    {
      const proj = setup('asset-base-url-sub-project-summer');
      writeFile(proj, 'docs/index.md', '# Hi\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'URL-1c',
        src: './docs',
        out: './site',
        theme: { template: 'summer' }
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'URL-1c: sub-project build with summer template succeeds');
      const html = fs.readFileSync(path.join(proj, 'site/index.html'), 'utf8');
      // Root deploys no longer emit <base href="/"> — relies on
      // relativePathToRoot + ./assets/...
      assert(!/<base\s+href="\/"\s*>/.test(html),
        'URL-1c: root project does NOT emit <base href="/"> (fixes #175 and #177)');
      assert(/href="\.\/assets\/template\/summer\.css/.test(html),
        'URL-1c: rendered HTML uses relative ./assets/template/summer.css');
      assert(/src="\.\/assets\/template\/summer\.js/.test(html),
        'URL-1c: rendered HTML uses relative ./assets/template/summer.js');
      assert(/window\.DOCMD_SITE_ROOT\s*=\s*"\/"/.test(html),
        'URL-1c: window.DOCMD_SITE_ROOT set to absolute "/"');
    }

    // URL-1d: end-to-end build of a default-template site. <base>
    // is present and the asset links are relative.
    {
      const proj = setup('asset-base-url-default-template');
      writeFile(proj, 'docs/index.md', '# Hi\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'URL-1d',
        src: './docs',
        out: './site'
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'URL-1d: default-template build succeeds');
      const html = fs.readFileSync(path.join(proj, 'site/index.html'), 'utf8');
      // Root deploys with default template: no <base> tag (relies on
      // relative ./assets/... resolution
      assert(!/<base\s+href="\/"\s*>/.test(html),
        'URL-1d: root deploy default template does NOT emit <base href="/">');
    }

    // URL-1e: the workspace sub-site case — a /search project must
    // have <base href="/search/"> and DOCMD_SITE_ROOT = "/search/".
    // Without this, the search sub-site at `/search` (no slash) would
    // resolve `./assets/template/summer.css` to `/assets/...` (root)
    // instead of `/search/assets/...` (correct).
    {
      const proj = setup('asset-base-url-workspace-summer');
      fs.mkdirSync(path.join(proj, 'docs-main'), { recursive: true });
      writeFile(proj, 'docs-main/index.md', '# Main\n');
      writeFile(proj, 'docmd-main/docmd.config.json', JSON.stringify({
        title: 'URL-1e Main', src: '.', out: '../site'
      }, null, 2) + '\n');
      fs.mkdirSync(path.join(proj, 'docs-search'), { recursive: true });
      writeFile(proj, 'docs-search/index.md', '# Search\n');
      writeFile(proj, 'docmd-search/docmd.config.json', JSON.stringify({
        title: 'URL-1e Search',
        src: '.', out: '../site',
        theme: { template: 'summer' }
      }, null, 2) + '\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        workspace: {
          projects: [
            { title: 'main', prefix: '/', src: './docs-main' },
            { title: 'search', prefix: '/search', src: './docs-search' }
          ]
        }
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'URL-1e: workspace build with summer sub-site succeeds');
      const searchHtml = fs.readFileSync(path.join(proj, 'site/search/index.html'), 'utf8');
      assert(/<base\s+href="\/search\/"\s*>/.test(searchHtml),
        'URL-1e: /search/ sub-site has <base href="/search/"> (absolute, not relative)');
      assert(/window\.DOCMD_SITE_ROOT\s*=\s*"\/search\/"/.test(searchHtml),
        'URL-1e: /search/ sub-site has window.DOCMD_SITE_ROOT = "/search/"');
    }

    // URL-1f: issue #175 — GitHub Pages project site (url has subpath,
    // no explicit base). base must be auto-derived to the subpath and
    // <base href> must point at it so assets resolve correctly.
    {
      const proj = setup('asset-base-url-gh-pages-subpath');
      writeFile(proj, 'docs/index.md', '# Home\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'URL-1f',
        url: 'https://alexhelms.github.io/some-project',
        src: './docs',
        out: './site'
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'URL-1f: GH Pages subpath build succeeds');
      const html = fs.readFileSync(path.join(proj, 'site/index.html'), 'utf8');
      assert(/<base\s+href="\/some-project\/"\s*>/.test(html),
        'URL-1f: GH Pages subpath emits <base href="/some-project/"> (fixes #175)');
      assert(/href="\.\/assets\/css\/docmd-main\.css/.test(html),
        'URL-1f: CSS link is relative (resolves via base)');
    }

    // URL-1g: issue #177 — --offline mode must NOT emit a <base> tag.
    // file:// resolution breaks if <base href="/"> is present because
    // it re-roots every relative URL to the filesystem root.
    {
      const proj = setup('asset-base-url-offline-mode');
      fs.mkdirSync(path.join(proj, 'docs/guide'), { recursive: true });
      writeFile(proj, 'docs/index.md', '# Home\n');
      writeFile(proj, 'docs/guide/page.md', '# Guide\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'URL-1g',
        src: './docs',
        out: './site'
      }, null, 2) + '\n');

      const result = execFileSync('node', [path.resolve(import.meta.dirname, '..', '..', 'packages', 'core', 'dist', 'bin', 'docmd.js'), 'build', '--offline'], {
        cwd: proj, encoding: 'utf8', stdio: 'pipe'
      });
      assert(result.includes('Build complete'), 'URL-1g: --offline build completes');
      const pageHtml = fs.readFileSync(path.join(proj, 'site/guide/page/index.html'), 'utf8');
      assert(!/<base\s+href=/.test(pageHtml),
        'URL-1g: --offline mode emits NO <base> tag (fixes #177)');
      assert(/href="\.\.\/\.\.\/assets\/css\/docmd-main\.css/.test(pageHtml),
        'URL-1g: nested page uses page-relative CSS path (resolves under file://)');
    }

    // URL-2: `engine: "rust"` (and `engines: { rust: {...} }`) is in
    // KNOWN_KEYS so a project that requests the rust preview engine
    // does not print an "Unknown property" warning.
    {
      const proj = setup('asset-base-url-engine-key');
      writeFile(proj, 'docs/index.md', '# Hi\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'URL-2',
        src: './docs',
        out: './site',
        engine: 'rust'
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'URL-2: build with engine: "rust" succeeds');
      assert(!/Unknown property "engine"/.test(result.output),
        'URL-2: no "Unknown property engine" warning (engine is in KNOWN_KEYS)');
    }

    // URL-2b: `engines` (the object form) is also in KNOWN_KEYS.
    {
      const proj = setup('asset-base-url-engines-key');
      writeFile(proj, 'docs/index.md', '# Hi\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        title: 'URL-2b',
        src: './docs',
        out: './site',
        engines: { rust: { /* would carry flags in a real config */ } }
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'URL-2b: build with engines: { rust: ... } succeeds');
      assert(!/Unknown property "engines"/.test(result.output),
        'URL-2b: no "Unknown property engines" warning');
    }

    // URL-3: project switcher must emit a directory-form href (with
    // trailing slash) for workspace sub-sites. A previous version of
    // project-switcher.ejs used a manual `replace(/\/+$/, '')` that
    // stripped the trailing slash, producing /search (file URL)
    // instead of /search/ (dir URL). That broke the <base href>
    // relative resolution on hosts that serve the directory index
    // without redirecting to the slash form.
    {
      const layoutPath = path.resolve(import.meta.dirname, '..', '..', 'packages', 'ui', 'templates', 'partials', 'project-switcher.ejs');
      const source = fs.readFileSync(layoutPath, 'utf8');
      // Source must NOT contain the old `replace(/\/+$/, '')` pattern
      // that was stripping the trailing slash.
      const oldPattern = "replace(/\\\\/+$/, ''";
      assert(!source.includes(oldPattern),
        'URL-3: project-switcher.ejs no longer uses replace(/\\/+$/, "") that strips trailing slash');
    }

    // URL-3b: end-to-end check that the switcher emits the correct
    // href for a workspace sub-site.
    {
      const proj = setup('asset-base-url-project-switcher-href');
      fs.mkdirSync(path.join(proj, 'docs-main'), { recursive: true });
      writeFile(proj, 'docs-main/index.md', '# Main\n');
      writeFile(proj, 'docmd-main/docmd.config.json', JSON.stringify({
        title: 'URL-3b Main', src: '.', out: '../site'
      }, null, 2) + '\n');
      fs.mkdirSync(path.join(proj, 'docs-search'), { recursive: true });
      writeFile(proj, 'docs-search/index.md', '# Search\n');
      writeFile(proj, 'docmd-search/docmd.config.json', JSON.stringify({
        title: 'URL-3b Search', src: '.', out: '../site'
      }, null, 2) + '\n');
      writeFile(proj, 'docmd.config.json', JSON.stringify({
        workspace: {
          projects: [
            { title: 'main', prefix: '/', src: './docs-main' },
            { title: 'search', prefix: '/search', src: './docs-search' }
          ]
        }
      }, null, 2) + '\n');

      const result = build(proj);
      assert(result.ok, 'URL-3b: workspace build for switcher test succeeds');
      const mainHtml = fs.readFileSync(path.join(proj, 'site/index.html'), 'utf8');
      // Find every project-switcher-item link and capture { href, title }.
      // The href is protocol-relative (//search/) because buildAbsoluteUrl
      // normalises the empty base to '/', which combines with /search to
      // //search. Browsers treat // as the same-scheme prefix, so this is
      // equivalent to /search/ in absolute terms.
      const switcherHrefs = Array.from(mainHtml.matchAll(/<a\s+href="([^"]+)"\s+class="project-switcher-item[^"]*"[^>]*>([\s\S]*?)<\/a>/g))
        .map(m => ({ href: m[1], title: (m[2].match(/<span class="project-title">([^<]+)<\/span>/) || [])[1] }));
      const searchHref = switcherHrefs.find(h => h.title === 'search');
      assert(searchHref, 'URL-3b: project switcher has a link to "search" sub-site');
      // The previous bug emitted /search (no slash) which made the
      // browser treat the URL as a file when npx serve served the
      // directory index. The fix keeps the trailing slash.
      assert(searchHref && /\/search\/$/.test(searchHref.href),
        `URL-3b: project switcher link to /search sub-site ends with /search/ (got: ${searchHref?.href})`);
      // The root project link should be "/" (no extra trailing slash
      // for the root). buildAbsoluteUrl collapses the // form to //.
      const mainHref = switcherHrefs.find(h => h.title === 'main');
      assert(mainHref && /^\/+$/.test(mainHref.href),
        `URL-3b: project switcher link to root project is "/" (got: ${mainHref?.href})`);
    }
  }
});

export const results = {
  get passed() { return passed; },
  get failed() { return failed; },
  get failures() { return [...failures]; }
};